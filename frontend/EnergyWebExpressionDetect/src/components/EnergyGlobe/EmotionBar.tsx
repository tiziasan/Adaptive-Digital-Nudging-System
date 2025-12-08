import React, { useMemo } from "react";

export type EmotionMap = {
  angry: number;
  disgusted: number;
  fearful: number;
  happy: number;
  neutral: number;
  sad: number;
  surprised: number;
};

type Props = {
  userEmotion?: EmotionMap | null;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
};

export default function EmotionBar({
  userEmotion,
  onThumbsUp,
  onThumbsDown,
}: Props) {
  const dominantEmotion = useMemo(() => {
    if (!userEmotion) return null;
    const entries = Object.entries(userEmotion) as Array<[keyof EmotionMap, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] ?? null;
  }, [userEmotion]);

  return (
    <div className="rounded-2xl border p-3 flex items-center justify-between">
      <div className="text-sm">
        <span className="font-medium">User emotion (live): </span>
        {dominantEmotion ? (
          <span className="capitalize">{dominantEmotion}</span>
        ) : (
          <span className="text-gray-500">not detected</span>
        )}
      </div>

      <div className="flex gap-2 text-sm">
        <button
          className="px-3 py-1 rounded-full border hover:bg-gray-50"
          onClick={onThumbsUp}
        >
          👍
        </button>
        <button
          className="px-3 py-1 rounded-full border hover:bg-gray-50"
          onClick={onThumbsDown}
        >
          👎
        </button>
      </div>
    </div>
  );
}
