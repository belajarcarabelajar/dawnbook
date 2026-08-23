import { describe, expect, test } from "bun:test";
// @ts-ignore
import { fixAndaToKamu } from "../../archive/scripts/fix_anda.js";

describe("fix_anda script", () => {
  test("replaces Anda and anda with kamu", () => {
    const input = "Apakah Anda tahu bahwa anda bisa belajar?";
    const expected = "Apakah kamu tahu bahwa kamu bisa belajar?";
    expect(fixAndaToKamu(input)).toBe(expected);
  });

  test("capitalizes kamu at start of sentences", () => {
    const input = "Ini kalimat pertama. kamu harus paham! kamu mengerti?";
    const expected = "Ini kalimat pertama. Kamu harus paham! Kamu mengerti?";
    expect(fixAndaToKamu(input)).toBe(expected);
  });

  test("capitalizes kamu at start of bullet list items", () => {
    const input = "- kamu bisa\n* kamu mau\n+ kamu mampu";
    const expected = "- Kamu bisa\n* Kamu mau\n+ Kamu mampu";
    expect(fixAndaToKamu(input)).toBe(expected);
  });

  test("capitalizes kamu at start of numbered list items", () => {
    const input = "1. kamu pertama\n2.  kamu kedua";
    const expected = "1. Kamu pertama\n2.  Kamu kedua";
    expect(fixAndaToKamu(input)).toBe(expected);
  });

  test("capitalizes kamu inside markdown formatting at sentence start", () => {
    const input = "Perhatikan ini. **kamu** *kamu* > kamu [kamu]";
    const expected = "Perhatikan ini. **Kamu** *kamu* > kamu [kamu]";
    expect(fixAndaToKamu(input)).toBe(expected);
  });

  test("does NOT capitalize words that contain kamu as prefix (e.g. kamus, kamuflase)", () => {
    const input = "Ini kalimat. kamuflase itu unik. Buka kamus kamu.";
    const expected = "Ini kalimat. kamuflase itu unik. Buka kamus kamu.";
    expect(fixAndaToKamu(input)).toBe(expected);
  });

  test("does NOT capitalize kamus at start of list item", () => {
    const input = "- kamus bahasa\n1. kamuflase hewan";
    const expected = "- kamus bahasa\n1. kamuflase hewan";
    expect(fixAndaToKamu(input)).toBe(expected);
  });
});
