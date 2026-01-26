\# Image Converter



A high-performance, client-side web application designed to convert, resize, and optimize images directly within the browser. This tool ensures user privacy by processing all data locally, eliminating the need for server-side uploads.



\## Key Features



\- \*\*Broad Format Support:\*\* Convert images to \*\*PNG\*\*, \*\*JPG\*\*, \*\*WebP\*\*, and \*\*AVIF\*\*. Includes native support for converting Apple \*\*HEIC/HEIF\*\* files.

\- \*\*Batch Processing:\*\* Process multiple images simultaneously. Toggle "Batch Mode" to queue files and export them as a single \*\*ZIP archive\*\*.

\- \*\*Smart Resizing:\*\* Adjust image dimensions with intelligent aspect ratio locking. Options to lock specific width or height values across a batch of images.

\- \*\*Compression Control:\*\* Fine-tune file size with an adjustable quality slider for lossy formats (JPG, WebP, AVIF).

\- \*\*Versatile Input:\*\* Supports Drag \& Drop, file selection via system dialog, and direct Clipboard pasting (`Ctrl+V` / `Cmd+V`).

\- \*\*Privacy-First:\*\* All image processing is performed entirely in the browser using JavaScript. No images are ever uploaded to a remote server.

\- \*\*Modern UI:\*\* Built with Material Design 3 principles for a clean, responsive experience on both desktop and mobile devices.



\## Usage Instructions



1\. \*\*Import Images\*\*

&nbsp;  - Drag and drop files directly onto the drop zone.

&nbsp;  - Click the \*\*Select Files\*\* button to browse your device.

&nbsp;  - Paste an image directly from your clipboard.

&nbsp;  - \*Note: Enable "Batch Mode" to process multiple files at once.\*



2\. \*\*Configure Output Settings\*\*

&nbsp;  - \*\*Format:\*\* Select your desired output format (PNG, JPG, WebP, or AVIF).

&nbsp;  - \*\*Quality:\*\* If using a lossy format, adjust the slider to balance image quality and file size.

&nbsp;  - \*\*Dimensions:\*\* Enter specific width or height values. Use the "Link" icon to maintain aspect ratio, or the "Lock" icons to apply specific dimensions to all images in a batch.



3\. \*\*Export\*\*

&nbsp;  - Click \*\*Download\*\* to save the processed image.

&nbsp;  - If processing multiple files, the tool will automatically generate and download a `.zip` file containing all converted images.

&nbsp;  - Toggle \*\*Auto Download\*\* for immediate saving upon processing.



\## Live Demo



Access the live application here:

\[https://ishtiakahmed-official.github.io/Image-Converter/](https://ishtiakahmed-official.github.io/Image-Converter/)



\## Technologies Used



\- \*\*HTML5 \& CSS3\*\* (Tailwind CSS for styling)

\- \*\*JavaScript (ES6+)\*\*

\- \*\*JSZip\*\* (For bulk archive generation)

\- \*\*heic2any\*\* (For HEIC/HEIF compatibility)



\## License



This project is dual-licensed:



\- \*\*Personal Use:\*\* Free for personal, non-commercial use.

\- \*\*Commercial Use:\*\* Commercial use requires a separate license.



See the \[LICENSE](./LICENSE) file for full details.



\## Author



\*\*Ishtiak Ahmed\*\*

