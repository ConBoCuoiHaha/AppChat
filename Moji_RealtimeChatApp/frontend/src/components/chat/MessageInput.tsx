import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, Video } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

const MAX_IMAGES = 6; // số ảnh tối đa cho 1 tin nhắn
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // video tối đa 50MB
const MAX_IMG_DIMENSION = 1600; // resize cạnh dài nhất về 1600px

// Nén ảnh ở client (resize + xuất JPEG) để ảnh lớn không bị vượt giới hạn upload
const compressImageToFile = (file: File): Promise<File> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > height && width > MAX_IMG_DIMENSION) {
        height = Math.round((height * MAX_IMG_DIMENSION) / width);
        width = MAX_IMG_DIMENSION;
      } else if (height >= width && height > MAX_IMG_DIMENSION) {
        width = Math.round((width * MAX_IMG_DIMENSION) / height);
        height = MAX_IMG_DIMENSION;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Không tạo được canvas"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Nén ảnh thất bại"));
          const name = file.name.replace(/\.\w+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được ảnh"));
    };
    img.src = url;
  });

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!user) return;

  // gửi tin nhắn (text và/hoặc ảnh và/hoặc video)
  const send = async (content: string, images?: string[], videoUrl?: string) => {
    if (selectedConvo.type === "direct") {
      const otherUser = selectedConvo.participants.filter(
        (p) => p._id !== user._id
      )[0];
      await sendDirectMessage(otherUser._id, content, images, videoUrl);
    } else {
      await sendGroupMessage(selectedConvo._id, content, images, videoUrl);
    }
  };

  const sendMessage = async () => {
    if (!value.trim()) return;
    const currValue = value;
    setValue("");

    try {
      await send(currValue);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // QUAN TRỌNG: phải lấy file ra MẢNG trước khi reset input.
    // Vì e.target.value="" sẽ làm RỖNG FileList (kể cả reference đã lấy) trên Chrome.
    const selected = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset để có thể chọn lại cùng ảnh

    if (selected.length === 0) return;

    let files = selected.filter((f) => f.type.startsWith("image/"));

    if (files.length === 0) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }

    if (files.length > MAX_IMAGES) {
      toast.info(`Chỉ gửi tối đa ${MAX_IMAGES} ảnh mỗi lần`);
      files = files.slice(0, MAX_IMAGES);
    }

    try {
      setSending(true);
      // nén ảnh trước khi upload; nếu nén lỗi (vd định dạng HEIC) -> dùng file gốc
      const compressed = await Promise.all(
        files.map(async (f) => {
          try {
            return await compressImageToFile(f);
          } catch (err) {
            console.warn("Nén ảnh lỗi, gửi file gốc:", err);
            return f;
          }
        })
      );
      const urls = await chatService.uploadImages(compressed);
      await send("", urls);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi ảnh. Bạn hãy thử lại!");
    } finally {
      setSending(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Chỉ chấp nhận file video");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("Video tối đa 50MB");
      return;
    }

    try {
      setSending(true);
      const url = await chatService.uploadVideo(file);
      await send("", undefined, url);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi video. Bạn hãy thử lại!");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 min-h-[56px] bg-background">
      {/* input file ẩn - cho phép chọn nhiều ảnh */}
      <input
        type="file"
        accept="image/*"
        multiple
        hidden
        ref={fileInputRef}
        onChange={handleImageSelect}
      />

      {/* input file ẩn - chọn video */}
      <input
        type="file"
        accept="video/*"
        hidden
        ref={videoInputRef}
        onChange={handleVideoSelect}
      />

      {/* nút chọn ảnh */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={sending}
        title={`Gửi hình ảnh (tối đa ${MAX_IMAGES})`}
        className="hover:bg-primary/10 transition-smooth"
      >
        <ImagePlus className="size-4" />
      </Button>

      {/* nút chọn video */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => videoInputRef.current?.click()}
        disabled={sending}
        title="Gửi video (tối đa 50MB)"
        className="hover:bg-primary/10 transition-smooth"
      >
        <Video className="size-4" />
      </Button>

      <div className="flex-1 relative">
        <Input
          onKeyPress={handleKeyPress}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={sending ? "Đang gửi..." : "Soạn tin nhắn..."}
          className="pr-12 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          <EmojiPicker
            onChange={(emoji: string) => setValue((prev) => `${prev}${emoji}`)}
          />
        </div>
      </div>

      <Button
        onClick={sendMessage}
        className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
        disabled={!value.trim() || sending}
      >
        <Send className="size-4 text-white" />
      </Button>
    </div>
  );
};

export default MessageInput;
