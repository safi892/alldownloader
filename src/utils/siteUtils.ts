/**
 * Utility to identify video sites and provide branding information
 */

export interface SiteInfo {
    name: string;
    logoUrl: string;
    color: string;
    domain: string;
}

const SITE_MAP: Record<string, { name: string; color: string }> = {
    'youtube.com': { name: 'YouTube', color: '#FF0000' },
    'youtu.be': { name: 'YouTube', color: '#FF0000' },
    'vimeo.com': { name: 'Vimeo', color: '#1AB7EA' },
    'tiktok.com': { name: 'TikTok', color: '#000000' },
    'instagram.com': { name: 'Instagram', color: '#E4405F' },
    'facebook.com': { name: 'Facebook', color: '#1877F2' },
    'fb.watch': { name: 'Facebook', color: '#1877F2' },
    'twitter.com': { name: 'Twitter', color: '#1DA1F2' },
    'x.com': { name: 'X', color: '#000000' },
    'twitch.tv': { name: 'Twitch', color: '#9146FF' },
    'dailymotion.com': { name: 'Dailymotion', color: '#0066DC' },
    'reddit.com': { name: 'Reddit', color: '#FF4500' },
    'pinterest.com': { name: 'Pinterest', color: '#BD081C' },
    'linkedin.com': { name: 'LinkedIn', color: '#0A66C2' },
};

export const getSiteInfo = (url: string | undefined): SiteInfo => {
    if (!url) {
        return {
            name: 'Unknown',
            logoUrl: '',
            color: '#666',
            domain: ''
        };
    }

    try {
        const parsedUrl = new URL(url);
        let host = parsedUrl.hostname.toLowerCase().replace('www.', '');

        // Find best match in SITE_MAP
        const siteKey = Object.keys(SITE_MAP).find(key => host.includes(key));

        const info = siteKey ? SITE_MAP[siteKey] : { name: host, color: '#3f3b54' };

        // Use Google's favicon service for a high-quality logo fallback
        const logoUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;

        return {
            name: info.name,
            logoUrl: logoUrl,
            color: info.color,
            domain: host
        };
    } catch (e) {
        return {
            name: 'Web',
            logoUrl: '',
            color: '#3f3b54',
            domain: ''
        };
    }
};
