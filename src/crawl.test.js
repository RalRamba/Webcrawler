import { normalizeURL } from "./crawl";
import { expect, test } from 'vitest';
import { normalizeURL } from "./crawl";
import { getH1fromHTML } from "./crawl";
import { getFirstParagraphFromHTML } from "./crawl";

test.each([
    ["https://blog.boot.dev/path/", "blog.boot.dev/path"],
    ["https://blog.boot.dev/path", "blog.boot.dev/path"],
    ["http://blog.boot.dev/path/", "blog.boot.dev/path"],
    ["http://blog.boot.dev/path", "blog.boot.dev/path"]
])("normalizes URL %s to %s", (input, expected) => {
    expect(normalizeURL(input)).toBe(expected);
});
//getH1FromHTML tests
test("getH1fromHTML basic", () => {
    const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
    const actual = getH1fromHTML(inputBody);
    const expected = "Test Title";
    expect(actual).toEqual(expected);
});
test("getFirstParagraphFromHTML main priority", () => {
    const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
    const actual = getFirstParagraphFromHTML(inputBody);
    const expected = "Main paragraph.";
    expect(actual).toEqual(expected);
});
