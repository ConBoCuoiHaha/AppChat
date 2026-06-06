import { cn, mediaUrl } from "@/lib/utils";

// Lưới ảnh kiểu Messenger cho 1-6 ảnh, bố cục vuông hợp lý theo số lượng
const MessageImages = ({ images }: { images: string[] }) => {
  const imgs = images.filter(Boolean).slice(0, 6);
  const n = imgs.length;

  if (n === 0) return null;

  // 1 ảnh: hiển thị nguyên ảnh, giới hạn chiều cao
  if (n === 1) {
    return (
      <img
        src={mediaUrl(imgs[0])}
        alt="hình ảnh"
        className="rounded-lg max-w-full max-h-72 object-cover"
      />
    );
  }

  const Tile = ({ src, className }: { src: string; className?: string }) => (
    <div className={cn("overflow-hidden bg-muted", className)}>
      <img
        src={mediaUrl(src)}
        alt="hình ảnh"
        className="w-full h-full object-cover"
      />
    </div>
  );

  const wrapper = "grid gap-1 rounded-lg overflow-hidden w-64";

  if (n === 2) {
    return (
      <div className={cn(wrapper, "grid-cols-2")}>
        {imgs.map((s, i) => (
          <Tile key={i} src={s} className="aspect-square" />
        ))}
      </div>
    );
  }

  // 3 và 5: 1 ảnh rộng phía trên + phần còn lại dạng lưới vuông
  if (n === 3) {
    return (
      <div className={cn(wrapper, "grid-cols-2")}>
        <Tile src={imgs[0]} className="col-span-2 aspect-[2/1]" />
        <Tile src={imgs[1]} className="aspect-square" />
        <Tile src={imgs[2]} className="aspect-square" />
      </div>
    );
  }

  if (n === 4) {
    return (
      <div className={cn(wrapper, "grid-cols-2")}>
        {imgs.map((s, i) => (
          <Tile key={i} src={s} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (n === 5) {
    return (
      <div className={cn(wrapper, "grid-cols-2")}>
        <Tile src={imgs[0]} className="col-span-2 aspect-[2/1]" />
        {imgs.slice(1).map((s, i) => (
          <Tile key={i} src={s} className="aspect-square" />
        ))}
      </div>
    );
  }

  // 6 ảnh: lưới 3 cột x 2 hàng
  return (
    <div className={cn(wrapper, "grid-cols-3")}>
      {imgs.map((s, i) => (
        <Tile key={i} src={s} className="aspect-square" />
      ))}
    </div>
  );
};

export default MessageImages;
