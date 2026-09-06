import { NextRequest, NextResponse } from 'next/server'
import { getAyahTajweed, getTopics, getCategoriesForTopic, getHukumsForCategory, describeSpan } from '@/lib/tajweed/tajweedEngineService'
import { getAyahText } from '@/lib/tajweed/edition'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'ayah': {
        const surah = parseInt(searchParams.get('surah') || '1')
        const ayah = parseInt(searchParams.get('ayah') || '1')
        const data = getAyahTajweed(surah, ayah)
        return NextResponse.json(data)
      }

      case 'text': {
        const surah = parseInt(searchParams.get('surah') || '1')
        const ayah = parseInt(searchParams.get('ayah') || '1')
        const text = getAyahText(surah, ayah)
        return NextResponse.json({ text })
      }

      case 'topics': {
        const topics = getTopics()
        return NextResponse.json({ topics })
      }

      case 'categories': {
        const topicId = searchParams.get('topic') || ''
        const categories = getCategoriesForTopic(topicId)
        return NextResponse.json({ categories })
      }

      case 'hukums': {
        const categoryId = searchParams.get('category') || ''
        const hukums = getHukumsForCategory(categoryId)
        return NextResponse.json({ hukums })
      }

      case 'describe': {
        const hukumId = searchParams.get('hukum') || ''
        const ruleId = searchParams.get('rule') || ''
        const description = describeSpan({ hukumId, ruleId })
        return NextResponse.json({ description })
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use: ayah, text, topics, categories, hukums, describe' },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('Tajweed engine API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    )
  }
}
