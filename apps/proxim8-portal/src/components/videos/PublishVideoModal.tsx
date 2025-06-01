"use client";

import React, { useState } from "react";
import { makeVideoPublic } from "@/services/video";
import { toast } from "react-hot-toast";

interface PublishVideoModalProps {
  videoId: string;
  title: string;
  onClose: () => void;
  onSuccess: (publicId: string) => void;
}

export default function PublishVideoModal({
  videoId,
  title: initialTitle,
  onClose,
  onSuccess,
}: PublishVideoModalProps) {
  const [title, setTitle] = useState<string>(initialTitle || "");
  const [description, setDescription] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const result = await makeVideoPublic(videoId, {
        title,
        description,
        tags: tagsArray,
      });

      if (result.success) {
        toast.success("Video published successfully!");
        onSuccess(result.publicVideoId);
      } else {
        setError("Failed to make video public");
        toast.error("Failed to make video public");
      }
    } catch (err) {
      setError("An error occurred while publishing the video");
      console.error("Error publishing video:", err);
      toast.error("An error occurred while publishing the video");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Make Video Public</h2>

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-800 text-red-100 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 h-24"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Publish Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
