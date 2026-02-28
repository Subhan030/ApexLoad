-- CreateTable
CREATE TABLE `test_configs` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `config_json` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_results` (
    `id` VARCHAR(36) NOT NULL,
    `config_id` VARCHAR(36) NOT NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ended_at` DATETIME(3) NULL,
    `status` VARCHAR(50) NOT NULL,
    `stats_json` JSON NULL,

    INDEX `test_results_config_id_idx`(`config_id`),
    INDEX `test_results_started_at_idx`(`started_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `test_results` ADD CONSTRAINT `test_results_config_id_fkey` FOREIGN KEY (`config_id`) REFERENCES `test_configs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
