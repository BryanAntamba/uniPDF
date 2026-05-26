const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const libre = require('libreoffice-convert');
const { exec } = require('child_process');

const app = express();

app.use(cors());

// ===============================
// CARPETA TEMPORAL PDF
// ===============================

app.use('/temp', express.static(path.join(__dirname, 'temp')));

// ===============================
// CREAR CARPETAS
// ===============================

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('temp')) fs.mkdirSync('temp');


// ===============================
// MULTER
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });
const uploadMultiple = multer({ storage }).array('archivos', 50);


// ===============================
// EXTENSIONES PERMITIDAS
// ===============================

const EXTENSIONES_LIBREOFFICE = [
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.rtf', '.odt', '.jpg', '.jpeg', '.png', '.bmp', '.gif'
];

const EXTENSIONES_NBCONVERT = ['.ipynb'];


// ===============================
// RUTA PRINCIPAL
// ===============================

app.get('/', (req, res) => {
  res.send('Servidor PDF funcionando');
});


// ===============================
// CONVERTIR ARCHIVO
// ===============================

app.post('/convertir', upload.single('archivo'), async (req, res) => {

  let archivoPath = null;
  let tempPdfPath = null;

  try {

    console.log('Archivo recibido');

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió archivo' });
    }

    archivoPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    console.log('Ruta archivo:', archivoPath);
    console.log('Extensión:', ext);

    if (!EXTENSIONES_LIBREOFFICE.includes(ext) && !EXTENSIONES_NBCONVERT.includes(ext)) {
      if (fs.existsSync(archivoPath)) fs.unlinkSync(archivoPath);
      return res.status(400).json({ error: `Formato ${ext} no soportado` });
    }

    const nombreTemp = `${Date.now()}.pdf`;
    tempPdfPath = path.join(__dirname, 'temp', nombreTemp);

    const eliminarTemp = () => {
      setTimeout(() => {
        if (fs.existsSync(tempPdfPath)) {
          fs.unlinkSync(tempPdfPath);
          console.log('PDF temporal eliminado:', nombreTemp);
        }
      }, 60000);
    };

    // ===============================
    // CONVERTIR CON NBCONVERT (.ipynb)
    // ===============================

    if (EXTENSIONES_NBCONVERT.includes(ext)) {

      console.log('Iniciando conversión con nbconvert (webpdf)...');

      const nombreBase = path.basename(nombreTemp, '.pdf');
      const comando = `jupyter nbconvert --to webpdf "${archivoPath}" --output-dir "${path.join(__dirname, 'temp')}" --output "${nombreBase}" --no-input`;

      console.log('Comando:', comando);

      exec(comando, { timeout: 110000 }, (err, stdout, stderr) => {

        console.log('STDOUT:', stdout);
        console.log('STDERR:', stderr);

        if (fs.existsSync(archivoPath)) fs.unlinkSync(archivoPath);

        if (err) {
          console.log('ERROR NBCONVERT:', err.message);
          return res.status(500).json({ error: 'Error al convertir notebook' });
        }

        if (!fs.existsSync(tempPdfPath)) {
          console.log('PDF no encontrado en:', tempPdfPath);
          return res.status(500).json({ error: 'PDF no generado' });
        }

        console.log('Conversión exitosa con nbconvert');
        eliminarTemp();
        return res.json({ nombre: nombreTemp });
      });

      return;
    }

    // ===============================
    // CONVERTIR CON LIBREOFFICE
    // ===============================

    console.log('Iniciando conversión con LibreOffice...');

    const file = fs.readFileSync(archivoPath);

    const convertirConTimeout = () => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout LibreOffice')), 110000);

      libre.convert(file, '.pdf', undefined, (err, done) => {
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(done);
      });
    });

    const pdfBuffer = await convertirConTimeout();

    console.log('Conversión exitosa');

    if (fs.existsSync(archivoPath)) fs.unlinkSync(archivoPath);

    fs.writeFileSync(tempPdfPath, pdfBuffer);
    eliminarTemp();

    return res.json({ nombre: nombreTemp });

  } catch (error) {

    console.log('ERROR GENERAL:');
    console.log(error);

    if (archivoPath && fs.existsSync(archivoPath)) fs.unlinkSync(archivoPath);
    if (tempPdfPath && fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);

    res.status(500).json({ error: 'Error del servidor' });
  }

});


// ===============================
// COMPRIMIR PDF
// ===============================

app.post('/comprimir', upload.single('archivo'), async (req, res) => {

  let archivoPath = null;
  let tempPdfPath = null;

  try {

    console.log('Archivo recibido para comprimir');

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió archivo' });
    }

    archivoPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext !== '.pdf') {
      if (fs.existsSync(archivoPath)) fs.unlinkSync(archivoPath);
      return res.status(400).json({ error: 'Solo se permiten archivos PDF' });
    }

    const nombreTemp = `${Date.now()}.pdf`;
    tempPdfPath = path.join(__dirname, 'temp', nombreTemp);

    const comando = `gswin64c -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dBATCH -dQUIET -dColorImageResolution=72 -dGrayImageResolution=72 -dMonoImageResolution=72 -sOutputFile="${tempPdfPath}" "${archivoPath}"`;

    console.log('Iniciando compresión con Ghostscript...');

    exec(comando, { timeout: 110000 }, (err, stdout, stderr) => {

      if (fs.existsSync(archivoPath)) fs.unlinkSync(archivoPath);

      if (err) {
        console.log('ERROR GHOSTSCRIPT:', err.message);
        console.log('STDERR:', stderr);
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
        return res.status(500).json({ error: 'Error al comprimir el PDF' });
      }

      if (!fs.existsSync(tempPdfPath)) {
        return res.status(500).json({ error: 'PDF comprimido no generado' });
      }

      const pesoOriginal = req.file.size;
      const tamanioComprimido = fs.statSync(tempPdfPath).size;
      const porcentaje = pesoOriginal > 0
        ? Math.max(0, Math.round(((pesoOriginal - tamanioComprimido) / pesoOriginal) * 100))
        : 0;

      console.log('Compresión exitosa');
      console.log(`Original: ${(pesoOriginal / 1024 / 1024).toFixed(2)} MB → Comprimido: ${(tamanioComprimido / 1024 / 1024).toFixed(2)} MB (${porcentaje}%)`);

      setTimeout(() => {
        if (fs.existsSync(tempPdfPath)) {
          fs.unlinkSync(tempPdfPath);
          console.log('PDF temporal eliminado:', nombreTemp);
        }
      }, 60000);

      return res.json({
        nombre: nombreTemp,
        tamanio: tamanioComprimido,
        tamanioOriginal: pesoOriginal,
        tamanioComprimido,
        porcentaje,
      });
    });

  } catch (error) {

    console.log('ERROR GENERAL:', error);

    if (archivoPath && fs.existsSync(archivoPath)) fs.unlinkSync(archivoPath);
    if (tempPdfPath && fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);

    res.status(500).json({ error: 'Error del servidor' });
  }

});


// ===============================
// UNIR PDFs
// ===============================

app.post('/unir', (req, res) => {
  uploadMultiple(req, res, async (err) => {
    let uploadedPaths = [];

    try {
      if (err) {
        console.log('ERROR MULTER:', err.message);
        return res.status(400).json({ error: 'Error al subir archivos' });
      }

      if (!req.files || req.files.length < 2) {
        return res.status(400).json({ error: 'Se necesitan al menos 2 archivos PDF' });
      }

      uploadedPaths = req.files.map((f) => f.path);

      for (const file of req.files) {
        if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
          uploadedPaths.forEach((p) => { if (fs.existsSync(p)) fs.unlinkSync(p); });
          return res.status(400).json({ error: 'Solo se permiten archivos PDF' });
        }
      }

      const { PDFDocument } = require('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      for (const filePath of uploadedPaths) {
        const bytes = fs.readFileSync(filePath);
        const pdf = await PDFDocument.load(bytes);
        const pageIndices = pdf.getPageIndices();
        const pages = await mergedPdf.copyPages(pdf, pageIndices);
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      uploadedPaths.forEach((p) => { if (fs.existsSync(p)) fs.unlinkSync(p); });
      uploadedPaths = [];

      const nombreTemp = `unido_${Date.now()}.pdf`;
      const tempPdfPath = path.join(__dirname, 'temp', nombreTemp);
      const mergedBytes = await mergedPdf.save();
      fs.writeFileSync(tempPdfPath, mergedBytes);

      setTimeout(() => {
        if (fs.existsSync(tempPdfPath)) {
          fs.unlinkSync(tempPdfPath);
          console.log('PDF unido temporal eliminado:', nombreTemp);
        }
      }, 60000);

      const tamanio = fs.statSync(tempPdfPath).size;
      console.log(`Unión exitosa: ${req.files.length} PDFs → ${nombreTemp}`);

      return res.json({ nombre: nombreTemp, tamanio, cantidad: req.files.length });
    } catch (error) {
      console.log('ERROR UNIR PDF:', error);
      uploadedPaths.forEach((p) => { if (fs.existsSync(p)) fs.unlinkSync(p); });
      return res.status(500).json({ error: 'Error al unir los PDFs' });
    }
  });
});


// ===============================
// PUERTO
// ===============================

const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});