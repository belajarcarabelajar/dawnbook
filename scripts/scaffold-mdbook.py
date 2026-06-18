#!/usr/bin/env python3
import sys
import re
import shutil
import os
import json

def get_valid_subject_labels(base_dir):
    labels_file = os.path.join(base_dir, 'data', 'subject-labels.json')
    try:
        with open(labels_file, 'r', encoding='utf-8') as f:
            return set(json.load(f))
    except Exception as e:
        print(f"Warning: Could not load subject-labels.json: {e}")
        return set()

def main():
    if len(sys.argv) < 2:
        print("Usage: python scaffold-mdbook.py <slug>")
        print("Example: python scaffold-mdbook.py my-new-book")
        sys.exit(1)

    slug = sys.argv[1]

    # Validate slug (Phase C equivalent)
    if not re.match(r'^[a-zA-Z0-9_-]+$', slug):
        print(f"ERROR: Invalid slug '{slug}'. Must contain only alphanumeric characters, dashes, or underscores.")
        sys.exit(1)
        
    if slug.startswith('_'):
        print(f"ERROR: Invalid slug '{slug}'. Must not start with an underscore.")
        sys.exit(1)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(base_dir, 'books', '_template')
    target_dir = os.path.join(base_dir, 'books', slug)

    if not os.path.exists(template_dir):
        print(f"ERROR: Template directory {template_dir} not found.")
        sys.exit(1)

    if os.path.exists(target_dir):
        print(f"ERROR: Book directory {target_dir} already exists.")
        sys.exit(1)
        
    # Interactive Prompts
    print(f"Scaffolding new book: {slug}")
    title = input("Enter Book Title: ").strip()
    author_input = input("Enter Author Name [Iwan Kurniawan]: ").strip()
    author = author_input if author_input else "Iwan Kurniawan"
    
    valid_labels = get_valid_subject_labels(base_dir)
    while True:
        subject = input("Enter Subject Label (must match data/subject-labels.json EXACTLY): ").strip()
        if not valid_labels or subject in valid_labels:
            break
        print(f"ERROR: '{subject}' is not in data/subject-labels.json. Please try again.")

    try:
        shutil.copytree(template_dir, target_dir)
        
        # Replace in book.toml
        book_toml_path = os.path.join(target_dir, 'book.toml')
        with open(book_toml_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = content.replace('authors = ["Iwan Kurniawan"]', f'authors = ["{author}"]')
        content = content.replace('title = "Placeholder Title"', f'title = "{title}"')
        content = content.replace('subject_label = "Placeholder"', f'subject_label = "{subject}"')
        
        with open(book_toml_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"\nSUCCESS: Scaffolded new book at books/{slug}")
        print("\n" + "="*60)
        print("NEXT STEPS:")
        print("1. Ask the AI OrchestratorAgent in your terminal to begin 'Phase B: AuthoringAgent'.")
        print("   Provide the AI with your raw chapter content.")
        print("   The AI will process the content following the 1:1 Subagent rules.")
        print("="*60)
    except Exception as e:
        print(f"ERROR: Failed to scaffold book: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
