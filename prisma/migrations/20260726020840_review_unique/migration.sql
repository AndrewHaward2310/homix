-- Chống trùng đánh giá: xoá review cũ hơn của cùng (căn, khách) rồi thêm unique index.
DELETE FROM "Review" a
  USING "Review" b
  WHERE a."createdAt" < b."createdAt"
    AND a."propertyId" = b."propertyId"
    AND a."customerId" = b."customerId";
CREATE UNIQUE INDEX "Review_propertyId_customerId_key" ON "Review"("propertyId", "customerId");
