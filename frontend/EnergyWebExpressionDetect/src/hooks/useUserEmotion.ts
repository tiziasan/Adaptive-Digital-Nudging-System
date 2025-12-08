import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export type EmotionMap = {
  angry: number; disgusted: number; fearful: number;
  happy: number; neutral: number; sad: number; surprised: number;
};

export function useUserEmotion(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [emotion, setEmotion] = useState<EmotionMap | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const loadAndStart = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    loadAndStart();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(async () => {
      if (!videoRef.current) return;

      const det = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (det?.expressions) {
        setEmotion({
          angry: det.expressions.angry,
          disgusted: det.expressions.disgusted,
          fearful: det.expressions.fearful,
          happy: det.expressions.happy,
          neutral: det.expressions.neutral,
          sad: det.expressions.sad,
          surprised: det.expressions.surprised,
        });
      }
    }, 1000);

    return () => clearInterval(id);
  }, [enabled]);

  return { emotion, videoRef };
}
