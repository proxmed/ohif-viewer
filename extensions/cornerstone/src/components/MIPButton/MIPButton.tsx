import React, { useCallback, useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import { Enums, BaseVolumeViewport } from '@cornerstonejs/core';
import {
    Button,
    Icons,
    Popover,
    PopoverContent,
    PopoverTrigger,
    useIconPresentation,
} from '@ohif/ui-next';

const DEFAULT_SLAB = 20;
const MIN_SLAB = 1;
const MAX_SLAB = 200;

function getActiveVolumeViewport(cornerstoneViewportService, viewportId?: string) {
    if (!viewportId) return null;
    const vp = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!vp || !(vp instanceof BaseVolumeViewport)) return null;
    return vp;
}

export function MIPButton({ viewportId: propViewportId, disabled, ...rest }) {
    const { servicesManager } = useSystem();
    const { viewportGridService, cornerstoneViewportService } = servicesManager.services;

    // Track active viewport
    const [activeViewportId, setActiveViewportId] = useState(
        () => propViewportId || viewportGridService.getActiveViewportId()
    );

    useEffect(() => {
        const { unsubscribe } = viewportGridService.subscribe(
            viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
            ({ viewportId }) => setActiveViewportId(viewportId)
        );
        return () => unsubscribe();
    }, [viewportGridService]);

    const viewportId = propViewportId || activeViewportId;

    // Own the popover open/close state — do NOT rely on toolbar's isOpen prop.
    // This prevents the mismatch where isOpen=true but isMIPActive=false on second enable.
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [isMIPActive, setIsMIPActive] = useState(false);
    const [slabThickness, setSlabThicknessState] = useState(DEFAULT_SLAB);
    const [isDragging, setIsDragging] = useState(false);

    // Suppress canvas pointer events while dragging the slab slider
    useEffect(() => {
        const styleId = 'mip-drag-disable-pointer';
        if (isDragging) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent =
                '.cornerstone-canvas, .cornerstone-viewport-element canvas { pointer-events: none !important; }';
            document.head.appendChild(style);
        } else {
            document.getElementById(styleId)?.remove();
        }
        return () => document.getElementById(styleId)?.remove();
    }, [isDragging]);

    // Reset when the active viewport changes
    useEffect(() => {
        setIsMIPActive(false);
        setPopoverOpen(false);
        setSlabThicknessState(DEFAULT_SLAB);
    }, [viewportId]);

    // ── Toggle MIP ────────────────────────────────────────────────────────────
    const handleToggle = useCallback(() => {
        const vp = getActiveVolumeViewport(cornerstoneViewportService, viewportId) as any;
        if (!vp) return;

        if (isMIPActive) {
            // Disable — back to normal composite
            vp.setBlendMode(Enums.BlendModes.COMPOSITE);
            vp.render();
            setIsMIPActive(false);
            setPopoverOpen(false);
        } else {
            // Enable MIP
            vp.setBlendMode(Enums.BlendModes.MAXIMUM_INTENSITY_BLEND);
            vp.setSlabThickness(slabThickness);
            vp.render();
            setIsMIPActive(true);
            setPopoverOpen(true); // open slider panel immediately
        }
    }, [isMIPActive, slabThickness, viewportId, cornerstoneViewportService]);

    // ── Slider change ─────────────────────────────────────────────────────────
    const handleSlabChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = Number(e.target.value);
            setSlabThicknessState(value);
            if (!isMIPActive) return;
            const vp = getActiveVolumeViewport(cornerstoneViewportService, viewportId) as any;
            if (!vp) return;
            vp.setSlabThickness(value);
            vp.render();
        },
        [isMIPActive, viewportId, cornerstoneViewportService]
    );

    const handleReset = useCallback(() => {
        setSlabThicknessState(DEFAULT_SLAB);
        const vp = getActiveVolumeViewport(cornerstoneViewportService, viewportId) as any;
        if (vp) {
            vp.setSlabThickness(DEFAULT_SLAB);
            vp.render();
        }
    }, [viewportId, cornerstoneViewportService]);

    const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
    const Icon = <Icons.Controls className={iconClassName} />;

    return (
        <Popover
            open={popoverOpen}
            onOpenChange={open => {
                // Allow clicking elsewhere to close, but don't disable MIP
                if (!open) setPopoverOpen(false);
            }}
        >
            <PopoverTrigger
                asChild
                className="flex items-center justify-center font-normal"
            >
                <div>
                    {IconContainer ? (
                        <IconContainer
                            disabled={disabled}
                            id="mip-button"
                            {...rest}
                            {...containerProps}
                            onInteraction={handleToggle}
                            variant={isMIPActive ? 'contained' : 'outline'}
                        >
                            {Icon}
                        </IconContainer>
                    ) : (
                        <Button
                            variant={isMIPActive ? 'default' : 'ghost'}
                            size="icon"
                            disabled={disabled}
                            onClick={handleToggle}
                        >
                            {Icon}
                        </Button>
                    )}
                </div>
            </PopoverTrigger>

            {/* Slab thickness panel — always rendered when MIP is active so popover has content */}
            <PopoverContent
                className="bg-popover w-72 rounded-lg border-none p-4 shadow-lg shadow-black/50"
                side="bottom"
                align="center"
                sideOffset={10}
                onWheel={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
            >
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-foreground text-sm font-semibold">MIP — Slab Thickness</span>
                        <button
                            className="text-muted-foreground hover:text-foreground text-xs underline"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                    </div>

                    <div
                        className="space-y-2"
                        onPointerDown={() => setIsDragging(true)}
                        onPointerUp={() => setIsDragging(false)}
                        onPointerLeave={() => setIsDragging(false)}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs">{MIN_SLAB} mm</span>
                            <span className="text-foreground font-mono text-sm font-bold">
                                {slabThickness} mm
                            </span>
                            <span className="text-muted-foreground text-xs">{MAX_SLAB} mm</span>
                        </div>

                        <input
                            type="range"
                            min={MIN_SLAB}
                            max={MAX_SLAB}
                            step={1}
                            value={slabThickness}
                            onChange={handleSlabChange}
                            className="w-full cursor-pointer"
                            style={{ accentColor: 'hsl(var(--primary))' }}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default MIPButton;
