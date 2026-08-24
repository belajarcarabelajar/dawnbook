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

class MockGSCServerHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    quota_trigger_count = 0

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

    def test_parallel_performance_boost(self):
        target_urls = [f"https://example.com/page{i}" for i in range(50)]

        # Measure sequential time
        t0 = time.time()
        stop_event = threading.Event()
        for url in target_urls:
            send_indexing_notification(url, "token123", stop_event, idx_endpoint=self.endpoint)
        seq_time = time.time() - t0

        # Measure parallel time with 10 workers
        t0 = time.time()
        process_indexing_batch(target_urls, "token123", max_workers=10, idx_endpoint=self.endpoint)
        par_time = time.time() - t0

        print(f"\n⚡ Performance Benchmark (50 URLs): Sequential={seq_time:.3f}s, Parallel(10 workers)={par_time:.3f}s, Speedup={seq_time/par_time:.2f}x")
        self.assertLess(par_time, seq_time)

if __name__ == '__main__':
    unittest.main()
