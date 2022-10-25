# Bookmarks Backup

Have you ever exported your bookmarks, only for some of them to break when importing them again?

https://user-images.githubusercontent.com/9403665/131939321-0d49fd61-8cd6-4231-9af7-ea70526a2f7f.mp4

> Looking at you Firefox, only allowing HTML as a Bookmarks export format...

Well this is the extension for you - exports your bookmarks in a state-of-the-art format, and easily import them later safely.

## How It's Made

**Tech Used:** HTML, CSS, JavaScript, WebExtensions API & [Polyfill](https://github.com/mozilla/webextension-polyfill)

This extension built off the [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) generates a tree of all your bookmarks & folders, allowing you to select which to export - additionally allowing you to import a `bookmarks.json` file previously generated by this extension.

## Optimizations

Handling of extremely long bookmark titles along with a high amount of bookmarks/folders can be tedious, and a number of folders containing only other folders can be collapsed to save space.

## Lessons Learned

Learning both the way Firefox exports bookmarks in raw HTML, and how to use the WebExtensions API & Polyfills to create a cross-browser extension was a great experience.
