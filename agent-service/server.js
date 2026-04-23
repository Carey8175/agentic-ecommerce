const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/agent/tryon', (req, res) => {
  const { product_id, user_image_base64 } = req.body;
  
  console.log(`[Try-On Request] Product ID: ${product_id}`);
  console.log(`[Try-On Request] Received image payload of length: ${user_image_base64?.length}`);

  // Mock processing delay
  setTimeout(() => {
    res.json({
      success: true,
      message: "BytePlus Seedance integration point mock",
      image_url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" // Placeholder
    });
  }, 2000);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Mock Agent Service running on http://localhost:${PORT}`);
});