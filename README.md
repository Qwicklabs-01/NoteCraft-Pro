# NoteCraft Pro

**Your Digital Notebook, Reimagined**

NoteCraft Pro is a versatile, modern digital notepad web application that combines sketching, drawing, annotation, screenshot capture, image editing, and organized note management in an intuitive booklet-style interface. 

## Features

- **Drawing & Sketching Tools**: Support for multiple pen types, customizable strokes, shapes, and freehand drawing.
- **Image Integration**: Upload images, capture screenshots, and perform basic image editing (crop, rotate, filters).
- **Marking & Annotation**: Text boxes, highlighters, and checklists.
- **Sticky Notes Mode**: Create quick, floating sticky notes for rapid thoughts and pin them alongside your work.
- **Cloud Ecosystem Sync**: Connect and backup directly to **Google Drive**, access files from Google Folders, and sync with Google Keep/Notes.
- **Office Integration**: Seamlessly export your notes and sketches directly to **MS Word** for professional formatting.
- **Booklet-Style Organization**: Group notes into customizable notebooks with page-turning animations and table of contents.
- **Note Management**: Search, tag, sort, and organize notebooks efficiently.
- **Export & Sharing**: Export individual pages or entire notebooks to PDF, PNG, or MS Word formats.

## Tech Stack

- **Frontend**: React.js with TypeScript, Vite, Tailwind CSS, Framer Motion
- **Canvas & Graphics**: Fabric.js, html2canvas, jsPDF, React Advanced Cropper
- **State Management**: Redux Toolkit
- **Backend (Configured for)**: Firebase (Auth, Firestore, Storage)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
