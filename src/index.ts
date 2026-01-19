import { main } from "./crawl";
console.log("Starting main...");
main();


if (import.meta.main) {
  main();
}
