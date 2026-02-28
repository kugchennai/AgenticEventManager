-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- Seed default volunteer promotion threshold
INSERT INTO "AppSetting" ("key", "value", "updatedAt")
VALUES ('volunteer_promotion_threshold', '5', NOW())
ON CONFLICT ("key") DO NOTHING;
