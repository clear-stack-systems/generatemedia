-- AlterTable
ALTER TABLE "Generation" ADD COLUMN "inputImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aspectRatio" TEXT,
ADD COLUMN "resolution" TEXT,
ADD COLUMN "duration" INTEGER,
ADD COLUMN "fixedLens" BOOLEAN,
ADD COLUMN "generateAudio" BOOLEAN;
