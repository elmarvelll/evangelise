-- CreateTable
CREATE TABLE `Livestream` (
    `id` VARCHAR(191) NOT NULL,
    `sessionName` VARCHAR(191) NOT NULL,
    `sessionDescription` VARCHAR(191) NOT NULL,
    `selectedTags` JSON NOT NULL,
    `interactionsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('LIVE', 'SCHEDULED') NOT NULL,
    `scheduleDate` DATETIME(3) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Livestream` ADD CONSTRAINT `Livestream_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
