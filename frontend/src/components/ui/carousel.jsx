import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const CarouselContext = React.createContext(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef((
  {
    orientation = "horizontal",
    opts,
    setApi,
    plugins,
    className,
    children,
    ...props
  },
  ref
) => {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  )

  React.useEffect(() => {
    if (!api) {
      return
    }

    if (setApi) {
      setApi(api)
    }
  }, [api, setApi])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
      }}>
      <div
        ref={ref}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
})
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props} />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props} />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { api } = useCarousel()
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)

    React.useEffect(() => {
      if (!api) return
      const onSelect = () => {
        setCanScrollPrev(api.canScrollPrev())
      }
      onSelect()
      api.on("select", onSelect)
      api.on("reInit", onSelect)
      return () => api.off("select", onSelect)
    }, [api])

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("absolute h-8 w-8 rounded-full", className)}
        onClick={() => api?.scrollPrev()}
        disabled={!canScrollPrev}
        {...props}>
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    )
  }
)
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { api } = useCarousel()
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    React.useEffect(() => {
      if (!api) return
      const onSelect = () => {
        setCanScrollNext(api.canScrollNext())
      }
      onSelect()
      api.on("select", onSelect)
      api.on("reInit", onSelect)
      return () => api.off("select", onSelect)
    }, [api])

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("absolute h-8 w-8 rounded-full", className)}
        onClick={() => api?.scrollNext()}
        disabled={!canScrollNext}
        {...props}>
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    )
  }
)
CarouselNext.displayName = "CarouselNext"

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
