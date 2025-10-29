from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from datetime import datetime
import os

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model
class ImageData(BaseModel):
    name: str
    image: str
    image_number: int
    id: str

# Create root dataset directory
os.makedirs("dataset", exist_ok=True)

@app.post("/capture")
async def receive_image(data: ImageData):
    try:
        print(f"\n{'='*50}")
        print(f"📸 Received image from: {data.name} (ID: {data.id})")
        print(f"🔢 Image number: {data.image_number}")
        print(f"📊 Image data length: {len(data.image)}")

        # Create folder for this specific person (based on ID)
        person_folder = os.path.join("dataset", data.id)
        os.makedirs(person_folder, exist_ok=True)

        # Extract base64 data (remove prefix)
        if "base64," in data.image:
            image_base64 = data.image.split("base64,")[1]
        else:
            image_base64 = data.image

        # Decode image
        image_bytes = base64.b64decode(image_base64)
        print(f"💾 Decoded image size: {len(image_bytes)} bytes ({len(image_bytes)/1024:.2f} KB)")

        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{data.name}_{data.image_number}_{timestamp}.jpg"
        filepath = os.path.join(person_folder, filename)

        # Save the image
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        print(f"✅ Image saved: {filepath}")
        print(f"{'='*50}\n")

        return {
            "message": f"Image {data.image_number} saved successfully for {data.name}!",
            "filepath": filepath,
            "folder": person_folder,
            "size_kb": round(len(image_bytes) / 1024, 2),
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Face Detection Training Data Server Running 🚀"}


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Face Detection Training Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
