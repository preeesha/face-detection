import { useState, useRef, useEffect } from "react";

function Capture() {
  const [name, setName] = useState("");
  const[id,setId]=useState("");

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setIsVideoReady(true);
            };
          }
        })
        .catch(err => console.error("Camera error:", err));
    } else {
      setIsVideoReady(false);
      setCapturedCount(0);
      let stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  }, [isCameraOn]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageData = canvasRef.current.toDataURL("image/jpeg");

    try {
      const res = await fetch("http://localhost:8000/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name:name, 
          image: imageData,
          image_number: capturedCount + 1,
          id:id
        }),
      });

      const data = await res.json();
      console.log(data)
      setCapturedCount(prev => prev + 1);
      console.log(`Image ${capturedCount + 1} captured for ${name}`);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to send image to backend");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleStop = () => {
    setIsCameraOn(false);
    if (capturedCount > 0) {
      alert(`Training complete! ${capturedCount} images captured for ${name}`);
    }
    setName("")
    setId("")
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>Face Detection Training Data Capture 📸</h2>

      {!isCameraOn ? (
        <>
          <input
            type="text"
            placeholder="Enter person's name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ padding: "10px", marginRight: "10px", fontSize: "16px" }}
          />
          <input
            type="text"
            placeholder="Enter person's id"
            value={id}
            onChange={e => setId(e.target.value)}
            style={{ padding: "10px", marginRight: "10px", fontSize: "16px" }}
          />
          <button 
            onClick={() => setIsCameraOn(true)} 
            disabled={!name && !id}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Start Camera
          </button>
        </>
      ) : (
        <>
          <div style={{ marginBottom: "20px" }}>
            <strong>Person: {name}</strong> | <strong>Images Captured: {capturedCount}</strong>
          </div>
          
          <video ref={videoRef} autoPlay playsInline width="640" height="480" style={{ border: "2px solid #333" }} />
          <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />
          
          <div style={{ marginTop: "20px" }}>
            <button 
              onClick={capturePhoto} 
              disabled={!isVideoReady || isCapturing}
              style={{ 
                padding: "10px 30px", 
                fontSize: "16px", 
                marginRight: "10px",
                backgroundColor: isCapturing ? "#ccc" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isVideoReady && !isCapturing ? "pointer" : "not-allowed"
              }}
            >
              {isCapturing ? "Sending..." : isVideoReady ? "📸 Capture Image" : "Loading..."}
            </button>
            <button 
              onClick={handleStop}
              style={{ 
                padding: "10px 30px", 
                fontSize: "16px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Stop & Finish
            </button>
          </div>
          
          <p style={{ marginTop: "20px", color: "#666" }}>
            Capture multiple images from different angles for better training
          </p>
        </>
      )}
    </div>
  );
}

export default Capture;