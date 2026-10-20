import { Module } from "@nestjs/common"
import { BullModule } from "@nestjs/bullmq"
import { BookmarksController } from "./bookmarks.controller"
import { BookmarksService } from "./bookmarks.service"
import { MetadataService } from "@/modules/cabinet/services/metadata.service"
import { LinkCheckerService } from "@/modules/cabinet/services/link-checker.service"
import { EnrichmentProcessor } from "@/modules/cabinet/workers/enrichment.processor"
import { GenericMetadataProvider } from "@/modules/cabinet/providers/metadata/generic.metadata-provider"
import { CabinetMediaService } from "@/modules/cabinet/services/cabinet-media.service"

@Module({
  imports: [
    BullModule.registerQueue({
      name: "bookmark-enrichment",
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
  ],
  controllers: [BookmarksController],
  providers: [
    BookmarksService,
    MetadataService,
    LinkCheckerService,
    EnrichmentProcessor,
    CabinetMediaService,
    GenericMetadataProvider,
  ],
  exports: [BookmarksService, MetadataService, CabinetMediaService],
})
export class BookmarksModule {}
