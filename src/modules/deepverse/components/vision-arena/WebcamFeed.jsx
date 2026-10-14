import { useRef, useEffect } from 'react'

export default function WebcamFeed({ stream, onVideoReady }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    video.srcObject = stream

    const handleLoaded = () => {
      video.play()
      if (onVideoReady) onVideoReady(video)
    }

    video.addEventListener('loadeddata', handleLoaded)

    return () => {
      video.removeEventListener('loadeddata', handleLoaded)
    }
  }, [stream, onVideoReady])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
    />
  )
}
