import { Module } from "@nestjs/common"
import { BullModule } from "@nestjs/bullmq"
import { BookmarksController } from "./bookmarks.controller"
import { BookmarksService } from "./bookmarks.service"
import { MetadataService } from "../services/metadata.service"
import { LinkCheckerService } from "../services/link-checker.service"
import { RedditProvider } from "../providers/reddit.provider"
import { EnrichmentProcessor } from "../workers/enrichment.processor"
import { GenericMetadataProvider } from "../providers/metadata/generic.metadata-provider"
import { ReaderService } from "../services/reader.service"
import { CabinetMediaService } from "../services/cabinet-media.service"

@Module({
  imports: [
    BullModule.registerQueue({
      name: "bookmark-enrichment",
    }),
  ],
  controllers: [BookmarksController],
  providers: [
    BookmarksService,
    MetadataService,
    LinkCheckerService,
    RedditProvider,
    EnrichmentProcessor,
    ReaderService,
    CabinetMediaService,
    GenericMetadataProvider,
  ],
  exports: [BookmarksService, MetadataService, ReaderService, CabinetMediaService],
})
export class BookmarksModule {}
