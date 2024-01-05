{
    window.downloadBook = async (content, bookId, floorId) => {
        if (!document.getElementById("img2pdfScript")) {
            await new Promise(resolve => {
                const script = document.createElement("script")
                script.addEventListener("load", resolve)
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.debug.js"
                script.id = "img2pdfScript"
                document.body.appendChild(script)
            })
        }

        const doc = new jsPDF()
        const pdfWidth = doc.internal.pageSize.getWidth()
        const pdfHeight = doc.internal.pageSize.getHeight()
        const pdfPadding = 20
        const pdfFontSize = 15

        doc.setFont("courier")
        doc.setFontSize(pdfFontSize)

        // draw top bar
        doc.setFontType("bold")
        doc.text(pdfPadding, pdfPadding, "Library of Léon")
        doc.text(pdfWidth - pdfPadding, pdfPadding, new Date().toLocaleDateString(), {align: "right"})

        doc.setFontType("normal")
        doc.textWithLink("noel-friedrich.de/lol", pdfPadding, pdfPadding + pdfFontSize / 2, {url: "https://noel-friedrich.de/lol/"})
        doc.text(pdfWidth - pdfPadding, pdfPadding + pdfFontSize / 2, `Floor#${floorId}`, {align: "right"})

        doc.setFontSize(12)
        const lines = doc.splitTextToSize(
            `${content}\n\nBook#${bookId}`, pdfWidth - pdfPadding * 2)
        
        let y = 35
        for (let line of lines) {
            y += 7
            if (y > pdfHeight - pdfPadding) {
                doc.addPage()
                y = pdfPadding + 5
            }
            doc.text(pdfPadding, y, line)
        }

        doc.save(`book${floorId}.pdf`)
    }   
}