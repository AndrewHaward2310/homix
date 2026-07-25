-- Thêm cột ảnh cho đánh giá (khách tự chụp)
ALTER TABLE "Review" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
