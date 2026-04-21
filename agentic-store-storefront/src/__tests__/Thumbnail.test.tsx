/**
 * Tests for Thumbnail component
 * src/modules/products/components/thumbnail/index.tsx
 */
import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import Thumbnail from "@modules/products/components/thumbnail"

// Mock next/image — render a plain <img> so we can assert src/alt
jest.mock("next/image", () => {
  const MockImage = ({ src, alt, onError, fill, ...rest }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={onError} data-fill={fill} {...rest} />
  )
  MockImage.displayName = "MockImage"
  return MockImage
})

// Mock PlaceholderImage so we can detect when it's shown
jest.mock("@modules/common/icons/placeholder-image", () => {
  const MockPlaceholder = ({ size }: { size: number }) => (
    <div data-testid="placeholder-image" data-size={size} />
  )
  MockPlaceholder.displayName = "MockPlaceholder"
  return MockPlaceholder
})

// Mock @medusajs/ui Container — just render a div with its children
jest.mock("@medusajs/ui", () => ({
  Container: ({ children, className, "data-testid": testId }: any) => (
    <div className={className} data-testid={testId}>{children}</div>
  ),
  clx: (...args: any[]) => {
    return args.flatMap((a) => {
      if (!a) return []
      if (typeof a === 'string') return [a]
      if (typeof a === 'object') return Object.entries(a).filter(([, v]) => v).map(([k]) => k)
      return []
    }).join(' ')
  },
}))

describe("Thumbnail", () => {
  // ── Image selection ──────────────────────────────────────────────────────

  it("renders img when thumbnail is provided", () => {
    render(<Thumbnail thumbnail="https://example.com/image.jpg" />)
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/image.jpg")
  })

  it("uses thumbnail over images array when both are provided", () => {
    render(
      <Thumbnail
        thumbnail="https://example.com/thumb.jpg"
        images={[{ url: "https://example.com/image0.jpg" } as any]}
      />
    )
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/thumb.jpg")
  })

  it("falls back to images[0].url when no thumbnail provided", () => {
    render(
      <Thumbnail
        images={[{ url: "https://example.com/image0.jpg" } as any]}
      />
    )
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/image0.jpg")
  })

  it("shows placeholder when no thumbnail and no images", () => {
    render(<Thumbnail />)
    expect(screen.getByTestId("placeholder-image")).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("shows placeholder when thumbnail is null and images is null", () => {
    render(<Thumbnail thumbnail={null} images={null} />)
    expect(screen.getByTestId("placeholder-image")).toBeInTheDocument()
  })

  it("shows placeholder when images array is empty", () => {
    render(<Thumbnail images={[]} />)
    expect(screen.getByTestId("placeholder-image")).toBeInTheDocument()
  })

  // ── Error fallback ───────────────────────────────────────────────────────

  it("shows placeholder when image fails to load", () => {
    render(<Thumbnail thumbnail="https://example.com/broken.jpg" />)
    const img = screen.getByRole("img")
    fireEvent.error(img)
    expect(screen.getByTestId("placeholder-image")).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  // ── Placeholder size ─────────────────────────────────────────────────────

  it("passes size 16 to placeholder when size is 'small'", () => {
    render(<Thumbnail size="small" />)
    expect(screen.getByTestId("placeholder-image")).toHaveAttribute("data-size", "16")
  })

  it("passes size 24 to placeholder when size is 'medium'", () => {
    render(<Thumbnail size="medium" />)
    expect(screen.getByTestId("placeholder-image")).toHaveAttribute("data-size", "24")
  })

  it("passes size 24 to placeholder when size is 'large'", () => {
    render(<Thumbnail size="large" />)
    expect(screen.getByTestId("placeholder-image")).toHaveAttribute("data-size", "24")
  })

  it("passes size 24 to placeholder when size is 'square'", () => {
    render(<Thumbnail size="square" />)
    expect(screen.getByTestId("placeholder-image")).toHaveAttribute("data-size", "24")
  })

  // ── data-testid forwarding ───────────────────────────────────────────────

  it("forwards data-testid to the container", () => {
    render(<Thumbnail data-testid="my-thumbnail" />)
    expect(screen.getByTestId("my-thumbnail")).toBeInTheDocument()
  })

  // ── CSS class application ────────────────────────────────────────────────

  it("applies aspect-[1/1] class for square size", () => {
    render(<Thumbnail size="square" data-testid="thumb" />)
    expect(screen.getByTestId("thumb").className).toContain("aspect-[1/1]")
  })

  it("applies aspect-[11/14] class when isFeatured is true", () => {
    render(<Thumbnail isFeatured data-testid="thumb" thumbnail="https://x.com/img.jpg" />)
    expect(screen.getByTestId("thumb").className).toContain("aspect-[11/14]")
  })
})
