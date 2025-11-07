'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { Navbar } from '@/components/layout/Navbar';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { useTour } from '@/lib/queries/tours';
import { transformDBTourToUITour } from '@/lib/db/tour-transformer';
import type { TourWithRelations } from '@/lib/db/repositories/tour-repository';
import { MapPinIcon, ClockIcon, StarIcon, ShieldIcon, ChevronLeftIcon } from '@/assets/svg';

export default function TourDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t, language } = useLanguage();

    const tourId = typeof id === 'string' ? id : id?.[0] || '';

    const { data: tourData, isLoading, error } = useTour(tourId, language);

    // Transform DB tour to UI tour format
    const tour = tourData ? transformDBTourToUITour(tourData as unknown as TourWithRelations) : null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <Loading size="lg" />
                </div>
            </div>
        );
    }

    if (error || !tour) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <h1 className="text-2xl font-bold mb-4">{t('common.error')}</h1>
                        <p className="text-muted-foreground mb-6">
                            {tour ? 'Tour not found' : 'Failed to load tour details'}
                        </p>
                        <Button onClick={() => router.push('/tours')}>
                            {t('common.back')} to {t('tours.title')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Link
                    href="/tours"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    {t('common.back')} to {t('tours.title')}
                </Link>

                {/* Hero Section with Image Carousel */}
                <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden mb-8">
                    {tour.images.length > 0 ? (
                        <ImageCarousel
                            images={tour.images}
                            autoRotateInterval={5000}
                            showDots={true}
                            showOverlay={true}
                            overlayOpacity="bg-black/30"
                            className="w-full h-full"
                        >
                            <div className="flex flex-col justify-end h-full p-8 text-white">
                                <div className="max-w-4xl">
                                    {tour.price === 0 && (
                                        <Badge variant="success" className="mb-4">
                                            {t('tours.free')}
                                        </Badge>
                                    )}
                                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{tour.title}</h1>
                                    {tour.brief && (
                                        <p className="text-lg md:text-xl opacity-90 line-clamp-2">{tour.brief}</p>
                                    )}
                                </div>
                            </div>
                        </ImageCarousel>
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-tp-blue-primary to-tp-blue-dark flex items-center justify-center">
                            <div className="text-center text-white">
                                <span className="text-6xl mb-4 block">🌍</span>
                                <h1 className="text-4xl font-bold">{tour.title}</h1>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        {tour.description && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-2xl font-bold mb-4">{t('tours.description')}</h2>
                                    <div
                                        className="prose prose-sm max-w-none text-muted-foreground"
                                        dangerouslySetInnerHTML={{ __html: tour.description.replace(/\n/g, '<br />') }}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* What's Included */}
                        {tour.includes && tour.includes.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-2xl font-bold mb-4">{t('tours.includes')}</h2>
                                    <ul className="space-y-2">
                                        {tour.includes.map((item, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <ShieldIcon className="w-5 h-5 text-tp-green mt-0.5 shrink-0" />
                                                <span className="text-muted-foreground">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Meeting Point */}
                        {tour.meetingPoint && (
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-2xl font-bold mb-4">{t('tours.meetingPoint')}</h2>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <MapPinIcon className="w-5 h-5 text-tp-blue-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium">{tour.meetingPoint.title}</p>
                                                {tour.meetingPoint.coordinates && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {tour.meetingPoint.coordinates}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8">
                            <CardContent className="p-6">
                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-sm text-muted-foreground">{t('tours.from')}</span>
                                        <span className="text-4xl font-bold">
                                            {tour.price > 0 ? `${tour.currency} ${tour.price}` : t('tours.free')}
                                        </span>
                                    </div>
                                    {tour.rating && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium">{tour.rating}</span>
                                            <span className="text-sm text-muted-foreground">
                                                ({tour.reviewsNumber} {tour.reviewsNumber === 1 ? 'review' : 'reviews'})
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Booking Button */}
                                <Button
                                    variant="accent"
                                    size="lg"
                                    className="w-full mb-6"
                                    onClick={() => {
                                        if (tour.bookingURL) {
                                            window.open(tour.bookingURL, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                >
                                    {t('tours.bookNow')}
                                </Button>

                                {/* Tour Details */}
                                <div className="space-y-4 border-t pt-6">
                                    <div className="flex items-start gap-3">
                                        <ClockIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">{t('tours.duration')}</p>
                                            <p className="text-sm text-muted-foreground">{tour.duration}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPinIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">{t('tours.destination')}</p>
                                            <p className="text-sm text-muted-foreground">{tour.destination}</p>
                                        </div>
                                    </div>

                                    {tour.provider && (
                                        <div className="flex items-start gap-3">
                                            <ShieldIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium">{t('tours.provider')}</p>
                                                <p className="text-sm text-muted-foreground">{tour.provider}</p>
                                                {tour.providerPhone && (
                                                    <a
                                                        href={`tel:${tour.providerPhone}`}
                                                        className="text-sm text-tp-blue-primary hover:underline mt-1 block"
                                                    >
                                                        {tour.providerPhone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

