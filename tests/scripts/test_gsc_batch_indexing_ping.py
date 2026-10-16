import unittest
import http.server
import socketserver
import threading
import time
import json
import os
import sys

# Ensure scripts directory is in sys.path
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(repo_root, "scripts"))

from gsc_batch_indexing_ping import (
    get_repo_path,
    send_indexing_notification,
    process_indexing_batch
)

class MockThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    # The default listen backlog of 5 overflows when 10 workers connect at once,
    # and each dropped SYN costs the client a 1 second retransmit.
    request_queue_size = 64

class MockGSCServerHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    quota_trigger_count = 0
    concurrency_lock = threading.Lock()
    concurrency_target = 1
    concurrency_release = threading.Event()
    in_flight = 0
    peak_in_flight = 0

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        if length > 0:
            self.rfile.read(length)

        if self.path == "/quota_test":
            MockGSCServerHandler.quota_trigger_count += 1
            if MockGSCServerHandler.quota_trigger_count >= 5:
                self.send_response(429)
                self.send_header('Content-Length', '0')
                self.end_headers()
                return

        if self.path == "/concurrency_test":
            cls = MockGSCServerHandler
            release = cls.concurrency_release
            with cls.concurrency_lock:
                cls.in_flight += 1
                cls.peak_in_flight = max(cls.peak_in_flight, cls.in_flight)
                if cls.in_flight >= cls.concurrency_target:
                    release.set()
            # Hold requests until concurrency_target overlap, so the peak does not depend on
            # scheduling speed; a sequential caller hits the timeout and still ends in seconds.
            if not release.wait(timeout=5):
                release.set()
            # Decrement before the response is sent, so a worker cannot start its
            # next request while this one is still counted.
            with cls.concurrency_lock:
                cls.in_flight -= 1

        time.sleep(0.01) # Simulate 10ms network latency
        self.send_response(200)
        self.send_header('Content-Length', '0')
        self.end_headers()

    def log_message(self, format, *args):
        pass

class TestGSCBatchIndexingPing(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = MockThreadedHTTPServer(('127.0.0.1', 0), MockGSCServerHandler)
        cls.port = cls.server.server_address[1]
        cls.server_thread = threading.Thread(target=cls.server.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        cls.endpoint = f"http://127.0.0.1:{cls.port}/publish"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        MockGSCServerHandler.quota_trigger_count = 0
        MockGSCServerHandler.concurrency_target = 1
        MockGSCServerHandler.concurrency_release = threading.Event()
        MockGSCServerHandler.in_flight = 0
        MockGSCServerHandler.peak_in_flight = 0

    def test_get_repo_path(self):
        path = get_repo_path("package.json")
        self.assertTrue(os.path.exists(path))
        self.assertTrue(path.endswith("package.json"))

    def test_send_indexing_notification_success(self):
        stop_event = threading.Event()
        url, is_success, is_quota, err = send_indexing_notification(
            "https://example.com/page1", "token123", stop_event, idx_endpoint=self.endpoint
        )
        self.assertTrue(is_success)
        self.assertFalse(is_quota)
        self.assertIsNone(err)
        self.assertFalse(stop_event.is_set())

    def test_send_indexing_notification_quota_429(self):
        endpoint = f"http://127.0.0.1:{self.port}/quota_test"
        stop_event = threading.Event()
        # Trigger 5 requests to force 429
        for _ in range(5):
            url, is_success, is_quota, err = send_indexing_notification(
                "https://example.com/page1", "token123", stop_event, idx_endpoint=endpoint
            )
            if is_quota:
                break
        self.assertTrue(is_quota)
        self.assertTrue(stop_event.is_set())

    def test_process_indexing_batch_parallel(self):
        target_urls = [f"https://example.com/page{i}" for i in range(20)]
        success_count, error_count = process_indexing_batch(
            target_urls, "token123", max_workers=5, idx_endpoint=self.endpoint
        )
        self.assertEqual(success_count, 20)
        self.assertEqual(error_count, 0)

    def test_process_indexing_batch_empty(self):
        success_count, error_count = process_indexing_batch(
            [], "token123", max_workers=5, idx_endpoint=self.endpoint
        )
        self.assertEqual(success_count, 0)
        self.assertEqual(error_count, 0)

    def test_process_indexing_batch_runs_requests_concurrently(self):
        target_urls = [f"https://example.com/page{i}" for i in range(50)]
        max_workers = 10
        MockGSCServerHandler.concurrency_target = max_workers
        endpoint = f"http://127.0.0.1:{self.port}/concurrency_test"

        t0 = time.time()
        success_count, error_count = process_indexing_batch(
            target_urls, "token123", max_workers=max_workers, idx_endpoint=endpoint
        )
        elapsed = time.time() - t0
        peak = MockGSCServerHandler.peak_in_flight

        print(f"\nConcurrency check (50 URLs, {max_workers} workers): peak in flight={peak}, elapsed={elapsed:.3f}s")
        self.assertEqual(success_count, 50)
        self.assertEqual(error_count, 0)
        self.assertGreater(peak, 1)
        self.assertLessEqual(peak, max_workers)

if __name__ == '__main__':
    unittest.main()
