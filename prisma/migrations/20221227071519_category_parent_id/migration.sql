-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
