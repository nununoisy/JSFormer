# JSFormer

Web-based replacement for the MSP432 Image Reformer

## Why?

To put it simply, the TI Image Reformer tool is not very good.
Here's what I don't like about it:

- The image importing is extremely finicky. For example, RGB-mode
  PNG files are not supported at all even though they display
  correctly in the preview.
- The image conversion is extremely limited and sometimes doesn't
  even work properly. I've found that it ignores certain colors for
  no apparent reason.
- The exported image data *has* to be written to a file. Most of
  the time, you want to include it in an already existing file,
  so you have to open the exported file and copy/paste the contents.
- Judging by the screenshots in the guidebook, the tool is decades
  old at least and doesn't appear to have been updated much.

This project aims to fix those shortcomings, and add a few benefits
of its own:

- Better image upload support: An HTML5 canvas is used to render the
  image, so any image that your browser can display is supported.
- Dithering support: JSFormer supports several types of dithering
  to improve image quality in some cases.
- Code export through the clipboard: Now you have several options
  once you get the code. You can paste directly into an existing
  file or create a new file and paste in the data.
- Code export customization: It is now possible to customize both
  the image naming prefix used in generated variable names and
  the indentation style used in the generated code.

There are still a few things that need to be implemented that
Image Reformer supports:

- RLE compression: I haven't yet dug into the compression format
  used in GrLib.
- 2bpp image support: Since the display driver I use on my board
  does not support 2bpp graphics I haven't implemented this yet.
  If there is demand I'll implement it (PRs accepted too!)

## How do I use it?

1. [Open the application.](https://nununoisy.github.io/JSFormer/)
2. Drag and drop an image onto the dropzone or click it to select
   an image.
3. Set the output size and dithering parameters as you please.
4. Set the code prefix and indentation style.
5. Click the "Copy to Clipboard" button or copy the code and use it!