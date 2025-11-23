import Image from 'next/image'
import { notFound } from 'next/navigation'
import { books } from '@/lib/data'
import { RatingStars } from '@/components/RatingStars'
import { AddToCart } from '@/components/AddToCart'

export default async function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const book = books.find(b => b.id === id)
  if (!book) return notFound()

  return (
    <section className="container-max py-10 grid gap-8 lg:grid-cols-2">
      <div className="relative aspect-[3/4] w-full">
        <Image src={book.cover} alt={book.title} fill className="object-cover rounded-xl" />
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
        <p className="text-neutral-600 mb-4">by {book.author}</p>
        <div className="flex items-center gap-3 mb-6">
          <RatingStars rating={book.rating} />
          <span className="text-sm text-neutral-600">{book.length}</span>
        </div>
        <p className="mb-6 text-neutral-800">{book.description}</p>
        <AddToCart id={book.id} price={book.price} />
      </div>
    </section>
  )
}
