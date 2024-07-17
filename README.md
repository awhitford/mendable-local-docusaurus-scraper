# Mendable Local Docusaurus Scraper

## Why?

It is easy to configure [Mendable](https://mendable.ai) to scrape a :globe_with_meridians: **public** web site, but what if your web site is :closed_lock_with_key: **private**?

This utility is designed to scan your [Docusaurus](https://docusaurus.io) site locally, and upload the content to Mendable.
It is particularly useful for _private_ web sites where Mendable can't access.
However, the markdown is uploaded, which may be better even for public Docusaurus sites. 

I was inspired to build this to upload a private [Docusaurus](https://docusaurus.io) site for [Mendable Search](https://docs.mendable.ai/integrations/docusaurus).

## Configuration

Configure your environment:  `.env` (or `.env.local`)
```
MENDABLE_SERVER_API_KEY=9ba...3be
```
* The `MENDABLE_SERVER_API_KEY` value may alternatively be passed as a command-line argument (`--api-key`)
* Environment variables may alternatively be configured using the command-line, like:
  ```
  export MENDABLE_SERVER_API_KEY=9ba...3be
  ```

## Usage

Build the utility:  `pnpm build`

See the usage:  `pnpm scrape`

Run against a project:  `pnpm scrape ../docusaurus-project-docs https://project-org.github.io/docusaurus-project-docs`
