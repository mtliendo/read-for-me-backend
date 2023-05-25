type TextractResponse = {
	Blocks: [
		{
			BlockType: 'LINE' | 'WORD' | 'PAGE'
			Id: string
			Relationships: [
				{
					Ids: [string]
					Type: string
				}
			]
			Text: string
		}
	]
}

export const extractWordsInOrder = (response: TextractResponse) => {
	let textInOrder: string[] = []

	response.Blocks.forEach((block) => {
		if (block.BlockType === 'LINE') {
			textInOrder.push(block.Text)
		}
	})

	return textInOrder
}
