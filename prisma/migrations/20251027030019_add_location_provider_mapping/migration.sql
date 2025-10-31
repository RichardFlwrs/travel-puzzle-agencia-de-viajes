-- CreateTable
CREATE TABLE `LocationProviderMapping` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `locationType` VARCHAR(20) NOT NULL,
    `isoCode` VARCHAR(2) NULL,
    `canonicalName` VARCHAR(255) NOT NULL,
    `providerId` VARCHAR(100) NOT NULL,
    `providerData` JSON NULL,
    `countryId` INTEGER NULL,
    `cityId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LocationProviderMapping_isoCode_locationType_idx`(`isoCode`, `locationType`),
    INDEX `LocationProviderMapping_provider_locationType_idx`(`provider`, `locationType`),
    UNIQUE INDEX `LocationProviderMapping_provider_locationType_providerId_key`(`provider`, `locationType`, `providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
