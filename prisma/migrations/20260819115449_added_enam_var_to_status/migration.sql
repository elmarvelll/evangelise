-- AlterTable
ALTER TABLE `livestream` MODIFY `status` ENUM('LIVE', 'SCHEDULED', 'ENDED') NOT NULL;
