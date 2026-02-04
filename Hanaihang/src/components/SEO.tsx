import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description = 'ค้นหาห้างสรรพสินค้าและร้านค้าชั้นนำในกรุงเทพฯ พร้อมข้อมูลเวลาเปิด-ปิด และแผนที่',
    image = '/logo-horizontal.svg',
    url,
    type = 'website',
}) => {
    const siteTitle = 'HaaNaiHang — หาในห้าง';
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            {/* Facebook Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default SEO;
