-- CreateTable
CREATE TABLE "ChordPreset" (
    "id" TEXT NOT NULL,
    "noteKey" TEXT NOT NULL,
    "noteIds" TEXT[],
    "archetypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "intent" TEXT,
    "namePl" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionPl" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChordPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChordPreset_noteKey_key" ON "ChordPreset"("noteKey");

-- CreateIndex
CREATE INDEX "ChordPreset_noteKey_idx" ON "ChordPreset"("noteKey");

-- CreateIndex
CREATE INDEX "ChordPreset_category_idx" ON "ChordPreset"("category");

-- CreateIndex
CREATE INDEX "ChordPreset_intent_idx" ON "ChordPreset"("intent");
