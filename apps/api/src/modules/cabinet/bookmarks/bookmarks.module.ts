import { Module } from "@nestjs/common"
import { BullModule } from "@nestjs/bullmq"
import { BookmarksController } from "./bookmarks.controller"
import { BookmarksService } from "./bookmarks.service"
import { MetadataService } from "../services/metadata.service"
import { LinkCheckerService } from "../services/link-checker.service"
import { RedditProvider } from "../providers/reddit.provider"
import { EnrichmentProcessor } from "../workers/enrichment.processor"
import { GenericMetadataProvider } from "../providers/metadata/generic.metadata-provider"
import { RedditMetadataProvider } from "../providers/metadata/reddit.metadata-provider"
import { TwitterMetadataProvider } from "../providers/metadata/twitter.metadata-provider"
import { ReaderService } from "../services/reader.service"

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
    // Metadata extraction providers
    GenericMetadataProvider,
    RedditMetadataProvider,
    TwitterMetadataProvider,
  ],
  exports: [BookmarksService, MetadataService, ReaderService],
})
export class BookmarksModule {}
