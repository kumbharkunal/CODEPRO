import React from 'react';
import { Code2, Braces, GitBranch, Terminal, Cpu, Zap } from 'lucide-react';

export function UniversalLoader() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50 overflow-hidden">
            {/* Tech Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5" />
            </div>

            <div className="relative flex flex-col items-center justify-center">
                {/* Dual Glow Layers for Depth */}
                <div className="absolute inset-0 bg-primary/20 dark:bg-primary/10 blur-3xl rounded-full animate-pulse scale-[2]" />

                {/* Main Reactor Container */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40">

                    {/* Orbiting Code Symbols - Ring 1 */}
                    <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full border border-primary/20 shadow-sm">
                            <Code2 className="w-4 h-4 text-primary/80" />
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full border border-primary/20 shadow-sm">
                            <Braces className="w-4 h-4 text-primary/80" />
                        </div>
                    </div>

                    {/* Orbiting Code Symbols - Ring 2 (Reverse) */}
                    <div className="absolute inset-2 animate-[spin_6s_linear_infinite_reverse]">
                        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full border border-primary/20 shadow-sm">
                            <GitBranch className="w-3 h-3 text-primary/60" />
                        </div>
                        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full border border-primary/20 shadow-sm">
                            <Terminal className="w-3 h-3 text-primary/60" />
                        </div>
                    </div>

                    {/* Rotating Rings */}
                    <div className="absolute inset-4 rounded-full border-t-2 border-r-2 border-primary/40 dark:border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)] animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-6 rounded-full border-r-2 border-b-2 border-primary/70 dark:border-primary/60 shadow-[0_0_10px_rgba(var(--primary),0.3)] animate-[spin_2s_linear_infinite_reverse]" />

                    {/* Center Core */}
                    <div className="absolute inset-[35%] bg-primary/5 backdrop-blur-md rounded-full flex items-center justify-center border border-primary/30 shadow-inner group">
                        <Cpu className="w-6 h-6 text-primary animate-pulse" />
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Text Area */}
                <div className="mt-12 space-y-3 text-center relative z-10">
                    <div className="flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4 text-primary animate-pulse" />
                        <h3 className="text-xl font-bold tracking-[0.2em] text-foreground/90 uppercase drop-shadow-sm">
                            CodePro
                        </h3>
                    </div>

                    {/* Loading Status */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-1 w-32 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary origin-left animate-[grow_1.5s_ease-in-out_infinite]" style={{
                                animation: 'grow 2s ease-in-out infinite'
                            }} />
                            <style>{`
                @keyframes grow {
                  0% { width: 0%; opacity: 1; }
                  50% { width: 70%; opacity: 1; }
                  100% { width: 100%; opacity: 0; }
                }
              `}</style>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
                            Loading Workspace...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
