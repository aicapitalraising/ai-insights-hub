import { motion } from 'framer-motion';
import { ThumbsUp, MessageCircle, Share2, Building2 } from 'lucide-react';

export default function ExampleAdPreview() {
  return (
    <motion.div
      className="glass-card rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="p-3 border-b border-border">
        <p className="text-[10px] font-display font-semibold text-primary uppercase tracking-wider">Example Ad Preview</p>
      </div>

      {/* Mock social post */}
      <div className="p-4">
        {/* Post header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-display font-bold text-foreground">Apex Capital Real Estate Fund</p>
            <p className="text-[10px] text-muted-foreground">Sponsored · <span className="text-muted-foreground/70">🌐</span></p>
          </div>
        </div>

        {/* Post copy */}
        <p className="text-xs text-foreground/90 leading-relaxed mb-3">
          🏠 <strong>Earn 15–20% Annual Returns</strong> investing in Single Family Real Estate — backed by a proven track record.
          <br /><br />
          ✅ Passive income quarterly distributions
          <br />
          ✅ Diversified across 50+ properties
          <br />
          ✅ $10M+ raised in under 90 days
          <br /><br />
          <span className="text-primary">Learn how accredited investors are building wealth → </span>
        </p>

        {/* AI Video Ad */}
        <div className="rounded-lg overflow-hidden border border-border mb-3">
          <video
            src="/videos/example-ai-ad.mp4"
            controls
            playsInline
            muted
            className="w-full"
            poster=""
          />
          <div className="bg-muted/30 px-3 py-2">
            <p className="font-display font-bold text-foreground text-xs">Example AI Video Ad</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Apex Capital Real Estate Fund</p>
          </div>
        </div>

        {/* CTA bar */}
        <div className="flex items-center justify-between border border-border rounded-lg p-3 mb-3">
          <div>
            <p className="text-[10px] text-muted-foreground">APEXCAPITAL.COM</p>
            <p className="text-xs font-display font-semibold text-foreground">Invest With Confidence</p>
          </div>
          <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded">
            Learn More
          </div>
        </div>

        {/* Engagement */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border">
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> 243</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 18</span>
          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> 7</span>
        </div>
      </div>
    </motion.div>
  );
}
