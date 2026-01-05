import { normalizeURL } from "./crawl";
import { expect, test } from 'vitest';
import { getH1fromHTML } from "./crawl";
import { getFirstParagraphFromHTML } from "./crawl";
import { getURLsFromHTML } from "./crawl";
import { getImagesFromHTML } from "./crawl";
import { extractPageData } from "./crawl";

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


//GetURLS Tests
test("getURLsFromHTML absolute", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><a href="https://blog.boot.dev"><span>Boot.dev</span></a></body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev"];

  expect(actual).toEqual(expected);
});

//GetImages Tests
test("getImagesFromHTML relative", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/logo.png"];

  expect(actual).toEqual(expected);
});



//extractPageData Tests
test("extractPageData basic", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

  const actual = extractPageData(inputBody, inputURL);
  const expected = {
    url: "https://blog.boot.dev",
    h1: "Test Title",
    first_paragraph: "This is the first paragraph.",
    outgoing_links: ["https://blog.boot.dev/link1"],
    image_urls: ["https://blog.boot.dev/image1.jpg"],
  };

  expect(actual).toEqual(expected);
});
