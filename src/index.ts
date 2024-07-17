import * as fs from 'fs'
import * as path from 'path'
import { program, Option } from "commander"
import { config } from "dotenv"
import { parse } from 'node-html-parser';


let verboseLogging = false

function verboseLog(message?: any, ...optionalParams: any[]) {
  if (verboseLogging) {
    console.log(message, optionalParams)
  }
}

function readDirectoryRecursively(dir: string): string[] {
  let results: string[] = []

  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat && stat.isDirectory()) {
      // Recurse into a subdirectory
      results = results.concat(readDirectoryRecursively(filePath))
    } else {
      // Is a file
      results.push(filePath)
    }
  })

  return results
}


program
  .name("mendable-local-docusaurus-scraper")
  .summary("Scrape a Docusaurus project and upload the content to Mendable.")
  .description("CLI to scrape a Docusaurus project and upload the content to Mendable.")
  .usage("<docusaurus-project-directory> <docusaurus-publish-url>")
  .argument("<<docusaurus-project-directory>>", "Docusaurus Project Directory (that has been built)")
  .argument("<docusaurus-publish-url>", "URL of Published Docusaurus Project")
  .addOption(
    new Option("--api_key <api_key>", "Mendable Server API Key for uploading sources").env("MENDABLE_SERVER_API_KEY"),
  )
  .option("--verbose", "Enable verbose logging", false)
  .showHelpAfterError()
  .parse()

const [docusaurusProjectDirectory, docusaurusPublishUrl] = program.args
const options = program.opts()
verboseLogging = options.verbose

config({
  debug: verboseLogging,
  path: [".env.local", ".env"],
})

const mendable_server_api_key = options.api_key ?? process.env.MENDABLE_SERVER_API_KEY
if (!mendable_server_api_key) {
  console.error("Missing Mendable Server Key")
  console.error(
    " - Either pass it as an argument --api_key or set it in the environment variable MENDABLE_SERVER_API_KEY",
  )
  process.exit(1)
}

// Use the build/docs directory for guidance, but publish corresponding markdown from the docs directory.
const buildDir = docusaurusProjectDirectory + "/build/docs/"
const sourceDir = docusaurusProjectDirectory + "/docs/"

const files = readDirectoryRecursively(buildDir)

// Read each file...
let ingestDocuments = []
for (const file of files) {
  verboseLog("Processing ", file)

  const html = parse(fs.readFileSync(file, { encoding: 'utf8' }))
  const htmlTitle = html.querySelector("head > title")?.text ?? path.basename(file, ".html")
  const title = htmlTitle.lastIndexOf(" | ") > 0 ? htmlTitle.substring(0, htmlTitle.lastIndexOf(" | ")) : htmlTitle

  const relPath = path.relative(buildDir, file)
  const sourceStem = path.join(sourceDir, path.dirname(relPath), path.basename(relPath, ".html"))
  let docPath = file
  if (fs.existsSync(sourceStem + ".md")) {
    docPath = sourceStem + ".md"
  } else if (fs.existsSync(sourceStem + ".mdx")) {
    docPath = sourceStem + ".mdx"
  } else {
    // use the original html file
    verboseLog("Warning: Markdown not found for ", file)
    continue
  }
  const content = fs.readFileSync(docPath, { encoding: 'utf8' })
  const sourceURL = docusaurusPublishUrl + path.join("/docs/", path.dirname(relPath), path.basename(relPath, ".html"))
  ingestDocuments.push({ content: content, source: sourceURL, metadata: { title: title} })
}

verboseLog("Ingestion Documents", ingestDocuments)

verboseLog("Sending documents to Mendable...")
const response = await fetch("https://api.mendable.ai/v1/ingestDocuments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    api_key: mendable_server_api_key,
    documents: ingestDocuments,
  }),
})

verboseLog("Done!", response)
