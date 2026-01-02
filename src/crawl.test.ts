import { normalizeURL } from "./crawl";
import {expect, test} from 'vitest'

test.each([
    ["https://blog.boot.dev/path/","blog.boot.dev/path"],
    ["https://blog.boot.dev/path","blog.boot.dev/path"],
    ["http://blog.boot.dev/path/","blog.boot.dev/path"],
    ["http://blog.boot.dev/path","blog.boot.dev/path"]
])("normalizes URL %s to %s", (input, expected) => {
    expect(normalizeURL(input)).toBe(expected);
});
