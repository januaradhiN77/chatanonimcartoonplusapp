import React, { useEffect } from "react"
import Chat from "./components/ChatAnonim"
import AOS from "aos"
import "aos/dist/aos.css"


function App() {
	useEffect(() => {
		AOS.init()
		AOS.refresh()
	}, [])

	return (
		<>
		

			<div
				className="lg:mx-[12%] lg:mt-10 lg:mb-20 lg:block"
				id="ChatAnonim_lg"
				data-aos="fade-up"
				data-aos-duration="1200">
				<Chat />
			</div>

	
		</>
	)
}

export default App
