import {
  BracketsCurlyIcon,
  CaretDownIcon,
  CheckIcon,
  CodeBlockIcon,
  CodeIcon,
  CopyIcon,
  DotsSixVerticalIcon,
  FileTextIcon,
  ImageIcon,
  LinkIcon,
  LinkSimpleBreakIcon,
  ListBulletsIcon,
  ListChecksIcon,
  ListNumbersIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  QuotesIcon,
  TableIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextH,
  TextHIcon,
  TextHOneIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextTSlashIcon,
  TextUnderlineIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import React from "react"

import type { BlockEditorIcons } from "./icon-types"
import { DEFAULT_LANGUAGE_ICONS } from "./language-icons"

const headingIcons: Record<number, React.ComponentType> = {
  1: TextHOneIcon,
  2: TextHTwoIcon,
  3: TextHThreeIcon,
}

export const HeadingIcon = ({ level }: { level: number }) => {
  const Icon = headingIcons[level] ?? TextH
  return <Icon />
}

// Phosphor Icons preset ("iconLibrary": "phosphor", @phosphor-icons/react).
export const DEFAULT_ICONS: BlockEditorIcons = {
  alignCenterIcon: <TextAlignCenterIcon />,
  alignLeftIcon: <TextAlignLeftIcon />,
  alignRightIcon: <TextAlignRightIcon />,
  boldIcon: <TextBIcon />,
  checkIcon: <CheckIcon />,
  codeBlockLanguageIcon: <BracketsCurlyIcon />,
  codeIcon: <CodeIcon />,
  copyIcon: <CopyIcon />,
  deleteIcon: <TrashIcon />,
  dragHandleIcon: (
    <DotsSixVerticalIcon className="block-editor-drag-handle-icon" />
  ),
  dropdownArrowIcon: <CaretDownIcon size={12} />,
  fallbackIcon: <FileTextIcon />,
  italicIcon: <TextItalicIcon />,
  languageIcons: DEFAULT_LANGUAGE_ICONS,
  linkIcon: <LinkIcon />,
  searchIcon: <MagnifyingGlassIcon size={14} />,
  slashBlockquoteIcon: <QuotesIcon />,
  slashBulletListIcon: <ListBulletsIcon />,
  slashCodeBlockIcon: <CodeBlockIcon />,
  slashDividerIcon: <MinusIcon />,
  slashHeadingIcon: <TextHIcon />,
  slashImageIcon: <ImageIcon />,
  slashOrderedListIcon: <ListNumbersIcon />,
  slashTableIcon: <TableIcon />,
  slashTaskListIcon: <ListChecksIcon />,
  slashTextIcon: <TextTSlashIcon />,
  strikethroughIcon: <TextStrikethroughIcon />,
  underlineIcon: <TextUnderlineIcon />,
  unlinkIcon: <LinkSimpleBreakIcon />,
}
