import React, { useEffect, useState } from 'react';
import { dbListen } from '@/lib/firebase';
import { 
  X, 
  Instagram, 
  Youtube, 
  Facebook, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

interface PopupConfig {
  enabled: boolean;
  bannerText: string;
}

const SocialMediaPopup = () => {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const unsubscribe = dbListen('settings/popup', (data) => {
      if (data) {
        setConfig(data);
        // Show popup if enabled and hasn't been shown in this session
        if (data.enabled && !hasShown) {
          setIsOpen(true);
          setHasShown(true);
        } else if (!data.enabled) {
          setIsOpen(false);
        }
      }
    });

    return () => unsubscribe();
  }, [hasShown]);

  if (!isOpen || !config) return null;

  const socialLinks = [
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://www.instagram.com/crescentschool_/',
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
      label: 'Follow on Instagram'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: 'https://www.youtube.com/@CRESCENTGROUPOFSCHOOL',
      color: 'bg-[#FF0000]',
      label: 'Subscribe on YouTube'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/crescentjuhapura/',
      color: 'bg-[#1877F2]',
      label: 'Like on Facebook'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="relative w-full max-w-md overflow-hidden shadow-2xl border-0 animate-in zoom-in-95 duration-300">
        <div className="absolute top-3 right-3 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            className="rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Hero Section */}
        <div className="relative h-40 bg-gradient-primary flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-24 h-24 bg-white rounded-full blur-2xl" />
            <div className="absolute bottom-0 -right-4 w-32 h-32 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative text-center p-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium mb-3 border border-white/30">
              <Sparkles className="w-3 h-3" />
              School Updates
            </div>
            <h3 className="text-2xl font-display font-bold text-white tracking-tight">
              Connect With Us!
            </h3>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Banner Text */}
          {config.bannerText && (
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-center">
              <p className="text-sm font-medium leading-relaxed italic text-muted-foreground">
                "{config.bannerText}"
              </p>
            </div>
          )}

          {/* Social Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Our Social Channels
            </p>
            <div className="grid gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3 rounded-2xl border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 shadow-lg",
                      social.color
                    )}>
                      <social.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{social.name}</p>
                      <p className="text-xs text-muted-foreground">{social.label}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          <Button 
            className="w-full bg-gradient-primary h-12 rounded-2xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            onClick={() => setIsOpen(false)}
          >
            Great, thanks!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaPopup;
