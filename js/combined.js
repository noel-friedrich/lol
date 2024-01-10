

// -------- js/controls/deviceorientationcontrols.js --------

class DeviceOrientationControls {

    static zee = new THREE.Vector3(0, 0, 1)
    static euler = new THREE.Euler()
    static q0 = new THREE.Quaternion()
    static q1 = new THREE.Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5))

    static setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
        this.euler.set(beta, alpha, -gamma, 'YXZ')
        quaternion.setFromEuler(DeviceOrientationControls.euler)
        quaternion.multiply(this.q1)
        quaternion.multiply(this.q0.setFromAxisAngle(this.zee, -orient))
    }

    constructor(object, element) {
        this.object = object
        this.element = element
        this.object.rotation.reorder("YXZ")
    
        this.enabled = false
        this.pressingElement = false
    
        this.deviceOrientation = {}
        this.screenOrientation = 0
    
        this.alphaOffsetAngle = 0
        this.betaOffsetAngle = 0
        this.gammaOffsetAngle = 0

        this.currAlpha = 0
        this.currBeta = 0
        this.currGamma = 0

        this._initListeners()
    }

    enable() {
        this.enabled = true
    }

	_onDeviceOrientationChange(event) {
        if (event.gamma) {
            if (!this.enabled) {
                this.enable()
            }
            this.deviceOrientation = event
        }
	}

	_onScreenOrientationChange() {
		this.screenOrientation = window.orientation || 0
	}

    _onTouchStart(event) {
        this.pressingElement = true
        event.preventDefault()
	}

    _onTouchEnd(event) {
        this.pressingElement = false
	}

	_initListeners() {
		this._onScreenOrientationChange()
		window.addEventListener("orientationchange", (event) => this._onScreenOrientationChange(event), false)
		window.addEventListener("deviceorientation", (event) => this._onDeviceOrientationChange(event), false)

        this.element.addEventListener("touchstart", (event) => this._onTouchStart(event))
        this.element.addEventListener("touchend", (event) => this._onTouchEnd(event))
        this.element.addEventListener("contextmenu", (event) => event.preventDefault())
	}

	update() {
        if (sceneManager.blockInputs) {
            return
        }
        
        const degToRad = (deg) => deg / 180 * Math.PI
        let alpha = this.deviceOrientation.alpha ? degToRad(this.deviceOrientation.alpha) + this.alphaOffsetAngle : 0
        let beta = this.deviceOrientation.beta ? degToRad(this.deviceOrientation.beta) + this.betaOffsetAngle : 0
        let gamma = this.deviceOrientation.gamma ? degToRad(this.deviceOrientation.gamma) + this.gammaOffsetAngle : 0
        const orient = this.screenOrientation ? degToRad(this.screenOrientation) : 0

        this.currAlpha = alpha
        this.currBeta = beta
        this.currGamma = gamma

        DeviceOrientationControls.setObjectQuaternion(this.object.quaternion, alpha, beta, gamma, orient)
	}
}

// -------- js/controls/firstpersoncontrols.js --------

class FirstPersonControls {

    constructor(camera, element) {
        this.camera = camera
        this.element = element

        this.mouseSensitivity = 1
        this.moveSpeed = 2

        this._moveDirection = new THREE.Vector3()
        this._sideAxis = new THREE.Vector3(0, 1, 0)

        this._controlsActive = false

        this.pressedClick = false

        this._initListeners()
    }

    async _initPointerLock() {
        this.element.requestPointerLock = this.element.requestPointerLock ||
            this.element.mozRequestPointerLock ||
            this.element.webkitRequestPointerLock
        if (this.element.requestPointerLock) {
            this.lastPointerLockInitTime = Date.now()
            await this.element.requestPointerLock()
        }

    }

    get inPointerlock() {
        return document.pointerLockElement == this.element
    }

    _removePointerLock() {
        document.exitPointerLock = document.exitPointerLock ||
            document.mozExitPointerLock ||
            document.webkitExitPointerLock
        if (document.exitPointerLock) {
            document.exitPointerLock()
            this.lastPointerLockInitTime = null
        }
    }

    _onMouseMove(event) {
        if (!this._controlsActive) {
            return
        }

        this.camera.rotation.order = "YXZ"
        this.camera.rotation.y -= event.movementX * 0.001 * this.mouseSensitivity
        this.camera.rotation.x -= event.movementY * 0.001 * this.mouseSensitivity

        if (this.camera.rotation.x > Math.PI / 2 - 0.001) {
            this.camera.rotation.x = Math.PI / 2 - 0.001
        } else if (this.camera.rotation.x < -Math.PI / 2 + 0.001) {
            this.camera.rotation.x = -Math.PI / 2 + 0.001
        }
    }

    _onKeyDown(event) {
        if (!event.key) return

        if (event.key.toUpperCase() == "W" || event.key == "ArrowUp") {
            this.movingForwards = true
        }

        if (event.key.toUpperCase() == "S" || event.key == "ArrowDown") {
            this.movingBackwards = true
        }

        if (event.key.toUpperCase() == "A" || event.key == "ArrowLeft") {
            this.movingLeft = true
        }

        if (event.key.toUpperCase() == "D" || event.key == "ArrowRight") {
            this.movingRight = true
        }
    }

    _onKeyUp(event) {
        if (!event.key) return

        if (event.key.toUpperCase() == "W" || event.key == "ArrowUp") {
            this.movingForwards = false
        }

        if (event.key.toUpperCase() == "S" || event.key == "ArrowDown") {
            this.movingBackwards = false
        }

        if (event.key.toUpperCase() == "A" || event.key == "ArrowLeft") {
            this.movingLeft = false
        }

        if (event.key.toUpperCase() == "D" || event.key == "ArrowRight") {
            this.movingRight = false
        }
    }

    cancelMovement() {
        this.movingForwards = false
        this.movingBackwards = false
        this.movingLeft = false
        this.movingRight = false
    }

    _onClick() {
        if (!this.inPointerlock) {
            return
        }

        if (this.lastPointerLockInitTime) {
            const timeDelta = Date.now() - this.lastPointerLockInitTime
            if (timeDelta < 1000) {
                return
            }
        }

        this.pressedClick = true
    }

    _initListeners() {
        window.camera = this.camera

        this.element.addEventListener("mousedown", () => {
            if (!this._controlsActive) {
                this._initPointerLock()
            }
        })

        this.element.addEventListener("click", event => this._onClick(event))   
        this.element.addEventListener("mousemove", event => this._onMouseMove(event))   
        addEventListener("keydown", event => this._onKeyDown(event))
        addEventListener("keyup", event => this._onKeyUp(event))

        const onLockChange = () => {
            if (document.pointerLockElement === this.element ||
                document.mozPointerLockElement === this.element ||
                document.webkitPointerLockElement === this.element) {

                this._controlsActive = true

            } else {
                this._controlsActive = false

                Menu.open()
            }
        }

        document.addEventListener("pointerlockchange", onLockChange)
        document.addEventListener("mozpointerlockchange", onLockChange)
        document.addEventListener("webkitpointerlockchange", onLockChange)
    }

    update() {
        this.pressedClick = false
        if (sceneManager.blockInputs) {
            return
        }

        this.camera.getWorldDirection(this._moveDirection)
        this._moveDirection.y = 0
        this._moveDirection.normalize()
        this._moveDirection.multiplyScalar(this.moveSpeed * 0.05)

        if (this.movingForwards) {
            this.camera.position.add(this._moveDirection)
        }

        this._moveDirection.applyAxisAngle(this._sideAxis, Math.PI)
        if (this.movingBackwards) {
            this.camera.position.add(this._moveDirection)
        }

        this._moveDirection.applyAxisAngle(this._sideAxis, -Math.PI / 2)
        if (this.movingLeft) {
            this.camera.position.add(this._moveDirection)
        }

        this._moveDirection.applyAxisAngle(this._sideAxis, Math.PI)
        if (this.movingRight) {
            this.camera.position.add(this._moveDirection)
        }
    }

}

// -------- js/controls/touchdragcontrols.js --------

const joystickContainer = document.getElementById("joystick-container")
const joystickThumb = document.getElementById("joystick-thumb")

class TouchDragControls {

    constructor(camera, element, toggleDragModeButton) {
        this.active = false
        this.camera = camera
        this.element = element
        this.toggleDragModeButton = toggleDragModeButton
        this.sensitivity = 1

        this.joystick = new Joystick(joystickContainer, joystickThumb)
        
        this.startX = null
        this.startY = null

        this.maxDistance = null

        this.originalX = null
        this.originalY = null

        this._moveDirection = new THREE.Vector3()
        this._sideAxis = new THREE.Vector3(0, 1, 0)
        this.moveSpeed = 2

        this._initListeners()
    }

    _onTouchStart(event) {
        this.startX = event.touches[0].clientX
        this.startY = event.touches[0].clientY
        this.maxDistance = 0
        this.originalX = this.camera.rotation.x
        this.originalY = this.camera.rotation.y
    }

    _onTouchMove(event) {
        const dx = event.touches[0].clientX - this.startX
        const dy = event.touches[0].clientY - this.startY

        let distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > this.maxDistance) {
            this.maxDistance = distance
        }

        if (!this.active || this.startX === null) return

        if (sceneManager.blockInputs) {
            return
        }

        this.camera.rotation.order = "YXZ"
        this.camera.rotation.y = this.originalY - dx * 0.005 * this.sensitivity
        this.camera.rotation.x = this.originalX - dy * 0.005 * this.sensitivity

        if (this.camera.rotation.x > Math.PI / 2 - 0.001) {
            this.camera.rotation.x = Math.PI / 2 - 0.001
        } else if (this.camera.rotation.x < -Math.PI / 2 + 0.001) {
            this.camera.rotation.x = -Math.PI / 2 + 0.001
        }
    }

    _onTouchEnd(event) {
        if (this.maxDistance <= 10) {
            sceneManager.keyboardMouseControls.pressedClick = true
        }

        if (!this.active) return

        this.startX = null
        this.startY = null
        this.maxDistance = null
        this.originalX = null
        this.originalY = null
    }

    _initListeners() {
        this.toggleDragModeButton.addEventListener("click", () => {
            this.active = !this.active
            if (this.active) {
                this.toggleDragModeButton.classList.remove("active")

                // remove camera roll
                DeviceOrientationControls.setObjectQuaternion(this.camera.quaternion, 0, Math.PI / 2, 0, 0)

                this.joystick.show()
            } else {
                this.toggleDragModeButton.classList.add("active")
            }
        })

        this.element.addEventListener("touchstart", e => this._onTouchStart(e))
        this.element.addEventListener("touchmove", e => this._onTouchMove(e))
        this.element.addEventListener("touchend", e => this._onTouchEnd(e))
    }

    update() {
        if (sceneManager.blockInputs) {
            return
        }

        this.camera.getWorldDirection(this._moveDirection)
        this._moveDirection.y = 0
        this._moveDirection.normalize()

        this._moveDirection.applyAxisAngle(this._sideAxis, -this.joystick.angle - Math.PI / 2)

        this._moveDirection.multiplyScalar(this.moveSpeed * 0.05 * this.joystick.magnitude)
        this.camera.position.add(this._moveDirection)
    }

}

// -------- js/controls/joystick.js --------

class Joystick {

    constructor(container, thumb) {
        this.container = container
        this.thumb = thumb

        this.thumbX = 0
        this.thumbY = 0

        this._initListeners()
    }

    get angle() {
        return Math.atan2(this.thumbY, this.thumbX)
    }

    get magnitude() {
        return Math.sqrt(this.thumbX ** 2 + this.thumbY ** 2)
    }

    normalize() {
        let factor = 1 / this.magnitude
        this.thumbX *= factor
        this.thumbY *= factor
    }

    _onTouchMove(event) {
        let rect = this.container.getBoundingClientRect()
        let x = (event.touches[0].clientX - rect.left) / rect.width
        let y = (event.touches[0].clientY - rect.top) / rect.height

        this.thumbX = (x - 0.5) * 2
        this.thumbY = (y - 0.5) * 2

        if (this.magnitude > 1) {
            this.normalize()
        }

        this.updateThumbPos()
    }

    _onTouchEnd(event) {
        this.thumbX = 0
        this.thumbY = 0
        this.updateThumbPos()
    }

    updateThumbPos() {
        this.thumb.style.left = `${(this.thumbX + 1) / 2 * this.container.clientWidth}px`
        this.thumb.style.top = `${(this.thumbY + 1) / 2 * this.container.clientHeight}px`
    }

    _initListeners() {
        this.container.addEventListener("touchmove", e => this._onTouchMove(e))
        this.container.addEventListener("touchend", e => this._onTouchEnd(e))
    }

    show() {
        this.container.style.display = "block"
    }

    hide() {
        this.container.style.display = "none"
    }

}

// -------- js/misc/allenglishwords.js --------

const wordlist1000 = [
    'a','aa','aaa','aaron','ab','abandoned','abc','aberdeen','abilities','ability','able','aboriginal','abortion','about','above','abraham','abroad','abs','absence','absent','absolute','absolutely','absorption','abstract','abstracts','abu','abuse','ac','academic','academics','academy','acc','accent','accept','acceptable','acceptance','accepted','accepting','accepts','access','accessed','accessibility','accessible','accessing','accessories','accessory','accident','accidents','accommodate','accommodation','accommodations','accompanied','accompanying','accomplish','accomplished','accordance','according','accordingly','account','accountability','accounting','accounts','accreditation','accredited','accuracy','accurate','accurately','accused','acdbentity','ace','acer','achieve','achieved','achievement','achievements','achieving','acid','acids','acknowledge','acknowledged','acm','acne','acoustic','acquire','acquired','acquisition','acquisitions','acre','acres','acrobat','across','acrylic','act','acting','action','actions','activated','activation','active','actively',
    'activists','activities','activity','actor','actors','actress','acts','actual','actually','acute','ad','ada','adam','adams','adaptation','adapted','adapter','adapters','adaptive','adaptor','add','added','addiction','adding','addition','additional','additionally','additions','address','addressed','addresses','addressing','adds','adelaide','adequate','adidas','adipex','adjacent','adjust','adjustable','adjusted','adjustment','adjustments','admin','administered','administration','administrative','administrator','administrators','admission','admissions','admit','admitted','adobe','adolescent','adopt','adopted','adoption','adrian','ads','adsl','adult','adults','advance','advanced','advancement','advances','advantage','advantages','adventure','adventures','adverse','advert','advertise','advertisement','advertisements','advertiser','advertisers','advertising','advice','advise','advised','advisor','advisors','advisory','advocacy','advocate','adware','ae','aerial','aerospace','af','affair','affairs','affect','affected','affecting','affects','affiliate','affiliated',
    'affiliates','affiliation','afford','affordable','afghanistan','afraid','africa','african','after','afternoon','afterwards','ag','again','against','age','aged','agencies','agency','agenda','agent','agents','ages','aggregate','aggressive','aging','ago','agree','agreed','agreement','agreements','agrees','agricultural','agriculture','ah','ahead','ai','aid','aids','aim','aimed','aims','air','aircraft','airfare','airline','airlines','airplane','airport','airports','aj','ak','aka','al','ala','alabama','alan','alarm','alaska','albania','albany','albert','alberta','album','albums','albuquerque','alcohol','alert','alerts','alex','alexander','alexandria','alfred','algebra','algeria','algorithm','algorithms','ali','alias','alice','alien','align','alignment','alike','alive','all','allah','allan','alleged','allen','allergy','alliance','allied','allocated','allocation','allow','allowance','allowed','allowing','allows','alloy',
    'almost','alone','along','alot','alpha','alphabetical','alpine','already','also','alt','alter','altered','alternate','alternative','alternatively','alternatives','although','alto','aluminium','aluminum','alumni','always','am','amanda','amateur','amazing','amazon','amazoncom','amazoncouk','ambassador','amber','ambien','ambient','amd','amend','amended','amendment','amendments','amenities','america','american','americans','americas','amino','among','amongst','amount','amounts','amp','ampland','amplifier','amsterdam','amy','an','ana','anaheim','anal','analog','analyses','analysis','analyst','analysts','analytical','analyze','analyzed','anatomy','anchor','ancient','and','andale','anderson','andorra','andrea','andreas','andrew','andrews','andy','angel','angela','angeles','angels','anger','angle','angola','angry','animal','animals','animated','animation','anime','ann','anna','anne','annex','annie','anniversary','annotated','annotation','announce','announced',
    'announcement','announcements','announces','annoying','annual','annually','anonymous','another','answer','answered','answering','answers','ant','antarctica','antenna','anthony','anthropology','anti','antibodies','antibody','anticipated','antigua','antique','antiques','antivirus','antonio','anxiety','any','anybody','anymore','anyone','anything','anytime','anyway','anywhere','aol','ap','apache','apart','apartment','apartments','api','apnic','apollo','app','apparatus','apparel','apparent','apparently','appeal','appeals','appear','appearance','appeared','appearing','appears','appendix','apple','appliance','appliances','applicable','applicant','applicants','application','applications','applied','applies','apply','applying','appointed','appointment','appointments','appraisal','appreciate','appreciated','appreciation','approach','approaches','appropriate','appropriations','approval','approve','approved','approx','approximate','approximately','apps','apr','april','apt','aqua','aquarium','aquatic','ar','arab','arabia','arabic','arbitrary','arbitration','arc',
    'arcade','arch','architect','architects','architectural','architecture','archive','archived','archives','arctic','are','area','areas','arena','arg','argentina','argue','argued','argument','arguments','arise','arising','arizona','arkansas','arlington','arm','armed','armenia','armor','arms','armstrong','army','arnold','around','arrange','arranged','arrangement','arrangements','array','arrest','arrested','arrival','arrivals','arrive','arrived','arrives','arrow','art','arthritis','arthur','article','articles','artificial','artist','artistic','artists','arts','artwork','aruba','as','asbestos','ascii','ash','ashley','asia','asian','aside','asin','ask','asked','asking','asks','asn','asp','aspect','aspects','aspnet','ass','assault','assembled','assembly','assess','assessed','assessing','assessment','assessments','asset','assets','assign','assigned','assignment','assignments','assist','assistance','assistant','assisted','assists','associate','associated','associates',
    'association','associations','assume','assumed','assumes','assuming','assumption','assumptions','assurance','assure','assured','asthma','astrology','astronomy','asus','at','ata','ate','athens','athletes','athletic','athletics','ati','atlanta','atlantic','atlas','atm','atmosphere','atmospheric','atom','atomic','attach','attached','attachment','attachments','attack','attacked','attacks','attempt','attempted','attempting','attempts','attend','attendance','attended','attending','attention','attitude','attitudes','attorney','attorneys','attract','attraction','attractions','attractive','attribute','attributes','au','auburn','auckland','auction','auctions','aud','audi','audience','audio','audit','auditor','aug','august','aurora','aus','austin','australia','australian','austria','authentic','authentication','author','authorities','authority','authorization','authorized','authors','auto','automated','automatic','automatically','automation','automobile','automobiles','automotive','autos','autumn','av','availability','available','avatar','ave','avenue',
    'average','avg','avi','aviation','avoid','avoiding','avon','aw','award','awarded','awards','aware','awareness','away','awesome','awful','axis','aye','az','azerbaijan','b','ba','babe','babes','babies','baby','bachelor','back','backed','background','backgrounds','backing','backup','bacon','bacteria','bacterial','bad','badge','badly','bag','baghdad','bags','bahamas','bahrain','bailey','baker','baking','balance','balanced','bald','bali','ball','ballet','balloon','ballot','balls','baltimore','ban','banana','band','bands','bandwidth','bang','bangbus','bangkok','bangladesh','bank','banking','bankruptcy','banks','banned','banner','banners','baptist','bar','barbados','barbara','barbie','barcelona','bare','barely','bargain','bargains','barn','barnes','barrel','barrier','barriers','barry','bars','base','baseball','based','baseline','basement','basename','bases','basic','basically','basics',
    'basin','basis','basket','basketball','baskets','bass','bat','batch','bath','bathroom','bathrooms','baths','batman','batteries','battery','battle','battlefield','bay','bb','bbc','bbs','bbw','bc','bd','bdsm','be','beach','beaches','beads','beam','bean','beans','bear','bearing','bears','beast','beastality','beastiality','beat','beatles','beats','beautiful','beautifully','beauty','beaver','became','because','become','becomes','becoming','bed','bedding','bedford','bedroom','bedrooms','beds','bee','beef','been','beer','before','began','begin','beginner','beginners','beginning','begins','begun','behalf','behavior','behavioral','behaviour','behind','beijing','being','beings','belarus','belfast','belgium','belief','beliefs','believe','believed','believes','belize','belkin','bell','belle','belly','belong','belongs','below','belt','belts','ben','bench','benchmark','bend','beneath','beneficial',
    'benefit','benefits','benjamin','bennett','benz','berkeley','berlin','bermuda','bernard','berry','beside','besides','best','bestiality','bestsellers','bet','beta','beth','better','betting','betty','between','beverage','beverages','beverly','beyond','bg','bhutan','bi','bias','bible','biblical','bibliographic','bibliography','bicycle','bid','bidder','bidding','bids','big','bigger','biggest','bike','bikes','bikini','bill','billing','billion','bills','billy','bin','binary','bind','binding','bingo','bio','biodiversity','biographies','biography','biol','biological','biology','bios','biotechnology','bird','birds','birmingham','birth','birthday','bishop','bit','bitch','bite','bits','biz','bizarre','bizrate','bk','bl','black','blackberry','blackjack','blacks','blade','blades','blah','blair','blake','blame','blank','blanket','blast','bleeding','blend','bless','blessed','blind','blink','block','blocked',
    'blocking','blocks','blog','blogger','bloggers','blogging','blogs','blond','blonde','blood','bloody','bloom','bloomberg','blow','blowing','blowjob','blowjobs','blue','blues','bluetooth','blvd','bm','bmw','bo','board','boards','boat','boating','boats','bob','bobby','boc','bodies','body','bold','bolivia','bolt','bomb','bon','bond','bondage','bonds','bone','bones','bonus','boob','boobs','book','booking','bookings','bookmark','bookmarks','books','bookstore','bool','boolean','boom','boost','boot','booth','boots','booty','border','borders','bored','boring','born','borough','bosnia','boss','boston','both','bother','botswana','bottle','bottles','bottom','bought','boulder','boulevard','bound','boundaries','boundary','bouquet','boutique','bow','bowl','bowling','box','boxed','boxes','boxing','boy','boys','bp','br','bra','bracelet','bracelets','bracket',
    'brad','bradford','bradley','brain','brake','brakes','branch','branches','brand','brandon','brands','bras','brass','brave','brazil','brazilian','breach','bread','break','breakdown','breakfast','breaking','breaks','breast','breasts','breath','breathing','breed','breeding','breeds','brian','brick','bridal','bride','bridge','bridges','brief','briefing','briefly','briefs','bright','brighton','brilliant','bring','bringing','brings','brisbane','bristol','britain','britannica','british','britney','broad','broadband','broadcast','broadcasting','broader','broadway','brochure','brochures','broke','broken','broker','brokers','bronze','brook','brooklyn','brooks','bros','brother','brothers','brought','brown','browse','browser','browsers','browsing','bruce','brunei','brunette','brunswick','brush','brussels','brutal','bryan','bryant','bs','bt','bubble','buck','bucks','budapest','buddy','budget','budgets','buf','buffalo','buffer','bufing','bug',
    'bugs','build','builder','builders','building','buildings','builds','built','bukkake','bulgaria','bulgarian','bulk','bull','bullet','bulletin','bumper','bunch','bundle','bunny','burden','bureau','buried','burke','burlington','burn','burner','burning','burns','burst','burton','bus','buses','bush','business','businesses','busty','busy','but','butler','butt','butter','butterfly','button','buttons','butts','buy','buyer','buyers','buying','buys','buzz','bw','by','bye','byte','bytes','c','ca','cab','cabin','cabinet','cabinets','cable','cables','cache','cached','cad','cadillac','cafe','cage','cake','cakes','cal','calcium','calculate','calculated','calculation','calculations','calculator','calculators','calendar','calendars','calgary','calibration','calif','california','call','called','calling','calls','calm','calvin','cam','cambodia','cambridge','camcorder','camcorders','came','camel','camera',
    'cameras','cameron','cameroon','camp','campaign','campaigns','campbell','camping','camps','campus','cams','can','canada','canadian','canal','canberra','cancel','cancellation','cancelled','cancer','candidate','candidates','candle','candles','candy','cannon','canon','cant','canvas','canyon','cap','capabilities','capability','capable','capacity','cape','capital','capitol','caps','captain','capture','captured','car','carb','carbon','card','cardiac','cardiff','cardiovascular','cards','care','career','careers','careful','carefully','carey','cargo','caribbean','caring','carl','carlo','carlos','carmen','carnival','carol','carolina','caroline','carpet','carried','carrier','carriers','carries','carroll','carry','carrying','cars','cart','carter','cartoon','cartoons','cartridge','cartridges','cas','casa','case','cases','casey','cash','cashiers','casino','casinos','casio','cassette','cast','casting','castle','casual','cat','catalog','catalogs',
    'catalogue','catalyst','catch','categories','category','catering','cathedral','catherine','catholic','cats','cattle','caught','cause','caused','causes','causing','caution','cave','cayman','cb','cbs','cc','ccd','cd','cdna','cds','cdt','ce','cedar','ceiling','celebrate','celebration','celebrities','celebrity','celebs','cell','cells','cellular','celtic','cement','cemetery','census','cent','center','centered','centers','central','centre','centres','cents','centuries','century','ceo','ceramic','ceremony','certain','certainly','certificate','certificates','certification','certified','cest','cet','cf','cfr','cg','cgi','ch','chad','chain','chains','chair','chairman','chairs','challenge','challenged','challenges','challenging','chamber','chambers','champagne','champion','champions','championship','championships','chan','chance','chancellor','chances','change','changed','changelog','changes','changing','channel','channels','chaos','chapel','chapter','chapters',
    'char','character','characteristic','characteristics','characterization','characterized','characters','charge','charged','charger','chargers','charges','charging','charitable','charity','charles','charleston','charlie','charlotte','charm','charming','charms','chart','charter','charts','chase','chassis','chat','cheap','cheaper','cheapest','cheat','cheats','check','checked','checking','checklist','checkout','checks','cheers','cheese','chef','chelsea','chem','chemical','chemicals','chemistry','chen','cheque','cherry','chess','chest','chester','chevrolet','chevy','chi','chicago','chick','chicken','chicks','chief','child','childhood','children','childrens','chile','china','chinese','chip','chips','cho','chocolate','choice','choices','choir','cholesterol','choose','choosing','chorus','chose','chosen','chris','christ','christian','christianity','christians','christina','christine','christmas','christopher','chrome','chronic','chronicle','chronicles','chrysler','chubby','chuck','church','churches','ci',
    'cia','cialis','ciao','cigarette','cigarettes','cincinnati','cindy','cinema','cingular','cio','cir','circle','circles','circuit','circuits','circular','circulation','circumstances','circus','cisco','citation','citations','cite','cited','cities','citizen','citizens','citizenship','city','citysearch','civic','civil','civilian','civilization','cj','cl','claim','claimed','claims','claire','clan','clara','clarity','clark','clarke','class','classes','classic','classical','classics','classification','classified','classifieds','classroom','clause','clay','clean','cleaner','cleaners','cleaning','cleanup','clear','clearance','cleared','clearing','clearly','clerk','cleveland','click','clicking','clicks','client','clients','cliff','climate','climb','climbing','clinic','clinical','clinics','clinton','clip','clips','clock','clocks','clone','close','closed','closely','closer','closes','closest','closing','closure','cloth','clothes','clothing','cloud','clouds','cloudy',
    'club','clubs','cluster','clusters','cm','cms','cn','cnet','cnetcom','cnn','co','coach','coaches','coaching','coal','coalition','coast','coastal','coat','coated','coating','cock','cocks','cod','code','codes','coding','coffee','cognitive','cohen','coin','coins','col','cold','cole','coleman','colin','collaboration','collaborative','collapse','collar','colleague','colleagues','collect','collectables','collected','collectible','collectibles','collecting','collection','collections','collective','collector','collectors','college','colleges','collins','cologne','colombia','colon','colonial','colony','color','colorado','colored','colors','colour','colours','columbia','columbus','column','columnists','columns','com','combat','combination','combinations','combine','combined','combines','combining','combo','come','comedy','comes','comfort','comfortable','comic','comics','coming','comm','command','commander','commands','comment','commentary','commented','comments','commerce','commercial',
    'commission','commissioner','commissioners','commissions','commit','commitment','commitments','committed','committee','committees','commodities','commodity','common','commonly','commons','commonwealth','communicate','communication','communications','communist','communities','community','comp','compact','companies','companion','company','compaq','comparable','comparative','compare','compared','comparing','comparison','comparisons','compatibility','compatible','compensation','compete','competent','competing','competition','competitions','competitive','competitors','compilation','compile','compiled','compiler','complaint','complaints','complement','complete','completed','completely','completing','completion','complex','complexity','compliance','compliant','complicated','complications','complimentary','comply','component','components','composed','composer','composite','composition','compound','compounds','comprehensive','compressed','compression','compromise','computation','computational','compute','computed','computer','computers','computing','con','concentrate','concentration','concentrations','concept','concepts','conceptual','concern','concerned','concerning','concerns','concert','concerts','conclude','concluded','conclusion',
    'conclusions','concord','concrete','condition','conditional','conditioning','conditions','condo','condos','conduct','conducted','conducting','conf','conference','conferences','conferencing','confidence','confident','confidential','confidentiality','config','configuration','configure','configured','configuring','confirm','confirmation','confirmed','conflict','conflicts','confused','confusion','congo','congratulations','congress','congressional','conjunction','connect','connected','connecticut','connecting','connection','connections','connectivity','connector','connectors','cons','conscious','consciousness','consecutive','consensus','consent','consequence','consequences','consequently','conservation','conservative','consider','considerable','consideration','considerations','considered','considering','considers','consist','consistency','consistent','consistently','consisting','consists','console','consoles','consolidated','consolidation','consortium','conspiracy','const','constant','constantly','constitute','constitutes','constitution','constitutional','constraint','constraints','construct','constructed','construction','consult','consultancy','consultant','consultants','consultation','consulting','consumer','consumers','consumption','contact','contacted','contacting',
    'contacts','contain','contained','container','containers','containing','contains','contamination','contemporary','content','contents','contest','contests','context','continent','continental','continually','continue','continued','continues','continuing','continuity','continuous','continuously','contract','contracting','contractor','contractors','contracts','contrary','contrast','contribute','contributed','contributing','contribution','contributions','contributor','contributors','control','controlled','controller','controllers','controlling','controls','controversial','controversy','convenience','convenient','convention','conventional','conventions','convergence','conversation','conversations','conversion','convert','converted','converter','convertible','convicted','conviction','convinced','cook','cookbook','cooked','cookie','cookies','cooking','cool','cooler','cooling','cooper','cooperation','cooperative','coordinate','coordinated','coordinates','coordination','coordinator','cop','cope','copied','copies','copper','copy','copying','copyright','copyrighted','copyrights','coral','cord','cordless','core','cork','corn','cornell','corner','corners','cornwall','corp',
    'corporate','corporation','corporations','corps','corpus','correct','corrected','correction','corrections','correctly','correlation','correspondence','corresponding','corruption','cos','cosmetic','cosmetics','cost','costa','costs','costume','costumes','cottage','cottages','cotton','could','council','councils','counsel','counseling','count','counted','counter','counters','counties','counting','countries','country','counts','county','couple','coupled','couples','coupon','coupons','courage','courier','course','courses','court','courtesy','courts','cove','cover','coverage','covered','covering','covers','cow','cowboy','cox','cp','cpu','cr','crack','cradle','craft','crafts','craig','crap','craps','crash','crawford','crazy','cream','create','created','creates','creating','creation','creations','creative','creativity','creator','creature','creatures','credit','credits','creek','crest','crew','cricket','crime','crimes','criminal','crisis','criteria','criterion','critical','criticism',
    'critics','crm','croatia','crop','crops','cross','crossing','crossword','crowd','crown','crucial','crude','cruise','cruises','cruz','cry','crystal','cs','css','cst','ct','cu','cuba','cube','cubic','cuisine','cult','cultural','culture','cultures','cum','cumshot','cumshots','cumulative','cunt','cup','cups','cure','curious','currencies','currency','current','currently','curriculum','cursor','curtis','curve','curves','custody','custom','customer','customers','customise','customize','customized','customs','cut','cute','cuts','cutting','cv','cvs','cw','cyber','cycle','cycles','cycling','cylinder','cyprus','cz','czech','d','da','dad','daddy','daily','dairy','daisy','dakota','dale','dallas','dam','damage','damaged','damages','dame','damn','dan','dana','dance','dancing','danger','dangerous','daniel','danish','danny','dans','dare','dark','darkness',
    'darwin','das','dash','dat','data','database','databases','date','dated','dates','dating','daughter','daughters','dave','david','davidson','davis','dawn','day','days','dayton','db','dc','dd','ddr','de','dead','deadline','deadly','deaf','deal','dealer','dealers','dealing','deals','dealt','dealtime','dean','dear','death','deaths','debate','debian','deborah','debt','debug','debut','dec','decade','decades','december','decent','decide','decided','decimal','decision','decisions','deck','declaration','declare','declared','decline','declined','decor','decorating','decorative','decrease','decreased','dedicated','dee','deemed','deep','deeper','deeply','deer','def','default','defeat','defects','defence','defend','defendant','defense','defensive','deferred','deficit','define','defined','defines','defining','definitely','definition','definitions','degree','degrees','del','delaware','delay','delayed','delays',
    'delegation','delete','deleted','delhi','delicious','delight','deliver','delivered','delivering','delivers','delivery','dell','delta','deluxe','dem','demand','demanding','demands','demo','democracy','democrat','democratic','democrats','demographic','demonstrate','demonstrated','demonstrates','demonstration','den','denial','denied','denmark','dennis','dense','density','dental','dentists','denver','deny','department','departmental','departments','departure','depend','dependence','dependent','depending','depends','deployment','deposit','deposits','depot','depression','dept','depth','deputy','der','derby','derek','derived','des','descending','describe','described','describes','describing','description','descriptions','desert','deserve','design','designated','designation','designed','designer','designers','designing','designs','desirable','desire','desired','desk','desktop','desktops','desperate','despite','destination','destinations','destiny','destroy','destroyed','destruction','detail','detailed','details','detect','detected','detection','detective','detector',
    'determination','determine','determined','determines','determining','detroit','deutsch','deutsche','deutschland','dev','devel','develop','developed','developer','developers','developing','development','developmental','developments','develops','deviant','deviation','device','devices','devil','devon','devoted','df','dg','dh','di','diabetes','diagnosis','diagnostic','diagram','dial','dialog','dialogue','diameter','diamond','diamonds','diana','diane','diary','dice','dick','dicke','dicks','dictionaries','dictionary','did','die','died','diego','dies','diesel','diet','dietary','diff','differ','difference','differences','different','differential','differently','difficult','difficulties','difficulty','diffs','dig','digest','digit','digital','dildo','dildos','dim','dimension','dimensional','dimensions','dining','dinner','dip','diploma','dir','direct','directed','direction','directions','directive','directly','director','directories','directors','directory','dirt','dirty','dis','disabilities','disability','disable',
    'disabled','disagree','disappointed','disaster','disc','discharge','disciplinary','discipline','disciplines','disclaimer','disclaimers','disclose','disclosure','disco','discount','discounted','discounts','discover','discovered','discovery','discrete','discretion','discrimination','discs','discuss','discussed','discusses','discussing','discussion','discussions','disease','diseases','dish','dishes','disk','disks','disney','disorder','disorders','dispatch','dispatched','display','displayed','displaying','displays','disposal','disposition','dispute','disputes','dist','distance','distances','distant','distinct','distinction','distinguished','distribute','distributed','distribution','distributions','distributor','distributors','district','districts','disturbed','div','dive','diverse','diversity','divide','divided','dividend','divine','diving','division','divisions','divorce','divx','diy','dj','dk','dl','dm','dna','dns','do','doc','dock','docs','doctor','doctors','doctrine','document','documentary','documentation','documentcreatetextnode','documented','documents','dod','dodge',
    'doe','does','dog','dogs','doing','doll','dollar','dollars','dolls','dom','domain','domains','dome','domestic','dominant','dominican','don','donald','donate','donated','donation','donations','done','donna','donor','donors','dont','doom','door','doors','dos','dosage','dose','dot','double','doubt','doug','douglas','dover','dow','down','download','downloadable','downloadcom','downloaded','downloading','downloads','downtown','dozen','dozens','dp','dpi','dr','draft','drag','dragon','drain','drainage','drama','dramatic','dramatically','draw','drawing','drawings','drawn','draws','dream','dreams','dress','dressed','dresses','dressing','drew','dried','drill','drilling','drink','drinking','drinks','drive','driven','driver','drivers','drives','driving','drop','dropped','drops','drove','drug','drugs','drum','drums','drunk','dry','dryer','ds','dsc','dsl','dt',
    'dts','du','dual','dubai','dublin','duck','dude','due','dui','duke','dumb','dump','duncan','duo','duplicate','durable','duration','durham','during','dust','dutch','duties','duty','dv','dvd','dvds','dx','dying','dylan','dynamic','dynamics','e','ea','each','eagle','eagles','ear','earl','earlier','earliest','early','earn','earned','earning','earnings','earrings','ears','earth','earthquake','ease','easier','easily','east','easter','eastern','easy','eat','eating','eau','ebay','ebony','ebook','ebooks','ec','echo','eclipse','eco','ecological','ecology','ecommerce','economic','economics','economies','economy','ecuador','ed','eddie','eden','edgar','edge','edges','edinburgh','edit','edited','editing','edition','editions','editor','editorial','editorials','editors','edmonton','eds','edt','educated','education','educational','educators','edward','edwards',
    'ee','ef','effect','effective','effectively','effectiveness','effects','efficiency','efficient','efficiently','effort','efforts','eg','egg','eggs','egypt','egyptian','eh','eight','either','ejaculation','el','elder','elderly','elect','elected','election','elections','electoral','electric','electrical','electricity','electro','electron','electronic','electronics','elegant','element','elementary','elements','elephant','elevation','eleven','eligibility','eligible','eliminate','elimination','elite','elizabeth','ellen','elliott','ellis','else','elsewhere','elvis','em','emacs','email','emails','embassy','embedded','emerald','emergency','emerging','emily','eminem','emirates','emission','emissions','emma','emotional','emotions','emperor','emphasis','empire','empirical','employ','employed','employee','employees','employer','employers','employment','empty','en','enable','enabled','enables','enabling','enb','enclosed','enclosure','encoding','encounter','encountered','encourage','encouraged','encourages','encouraging','encryption',
    'encyclopedia','end','endangered','ended','endif','ending','endless','endorsed','endorsement','ends','enemies','enemy','energy','enforcement','eng','engage','engaged','engagement','engaging','engine','engineer','engineering','engineers','engines','england','english','enhance','enhanced','enhancement','enhancements','enhancing','enjoy','enjoyed','enjoying','enlarge','enlargement','enormous','enough','enquiries','enquiry','enrolled','enrollment','ensemble','ensure','ensures','ensuring','ent','enter','entered','entering','enterprise','enterprises','enters','entertaining','entertainment','entire','entirely','entities','entitled','entity','entrance','entrepreneur','entrepreneurs','entries','entry','envelope','environment','environmental','environments','enzyme','eos','ep','epa','epic','epinions','epinionscom','episode','episodes','epson','eq','equal','equality','equally','equation','equations','equilibrium','equipment','equipped','equity','equivalent','er','era','eric','ericsson','erik','erotic','erotica','erp','error','errors',
    'es','escape','escort','escorts','especially','espn','essay','essays','essence','essential','essentially','essentials','essex','est','establish','established','establishing','establishment','estate','estates','estimate','estimated','estimates','estimation','estonia','et','etc','eternal','ethernet','ethical','ethics','ethiopia','ethnic','eu','eugene','eur','euro','europe','european','euros','ev','eva','eval','evaluate','evaluated','evaluating','evaluation','evaluations','evanescence','evans','eve','even','evening','event','events','eventually','ever','every','everybody','everyday','everyone','everything','everywhere','evidence','evident','evil','evolution','ex','exact','exactly','exam','examination','examinations','examine','examined','examines','examining','example','examples','exams','exceed','excel','excellence','excellent','except','exception','exceptional','exceptions','excerpt','excess','excessive','exchange','exchanges','excited','excitement','exciting','exclude','excluded','excluding','exclusion',
    'exclusive','exclusively','excuse','exec','execute','executed','execution','executive','executives','exempt','exemption','exercise','exercises','exhaust','exhibit','exhibition','exhibitions','exhibits','exist','existed','existence','existing','exists','exit','exotic','exp','expand','expanded','expanding','expansion','expansys','expect','expectations','expected','expects','expedia','expenditure','expenditures','expense','expenses','expensive','experience','experienced','experiences','experiencing','experiment','experimental','experiments','expert','expertise','experts','expiration','expired','expires','explain','explained','explaining','explains','explanation','explicit','explicitly','exploration','explore','explorer','exploring','explosion','expo','export','exports','exposed','exposure','express','expressed','expression','expressions','ext','extend','extended','extending','extends','extension','extensions','extensive','extent','exterior','external','extra','extract','extraction','extraordinary','extras','extreme','extremely','eye','eyed','eyes','ez','f','fa','fabric',
    'fabrics','fabulous','face','faced','faces','facial','facilitate','facilities','facility','facing','fact','factor','factors','factory','facts','faculty','fail','failed','failing','fails','failure','failures','fair','fairfield','fairly','fairy','faith','fake','fall','fallen','falling','falls','false','fame','familiar','families','family','famous','fan','fancy','fans','fantastic','fantasy','faq','faqs','far','fare','fares','farm','farmer','farmers','farming','farms','fascinating','fashion','fast','faster','fastest','fat','fatal','fate','father','fathers','fatty','fault','favor','favorite','favorites','favors','favour','favourite','favourites','fax','fbi','fc','fcc','fd','fda','fe','fear','fears','feat','feature','featured','features','featuring','feb','february','fed','federal','federation','fee','feed','feedback','feeding','feeds','feel','feeling','feelings','feels',
    'fees','feet','fell','fellow','fellowship','felt','female','females','fence','feof','ferrari','ferry','festival','festivals','fetish','fever','few','fewer','ff','fg','fi','fiber','fibre','fiction','field','fields','fifteen','fifth','fifty','fig','fight','fighter','fighters','fighting','figure','figured','figures','fiji','file','filed','filename','files','filing','fill','filled','filling','film','filme','films','filter','filtering','filters','fin','final','finally','finals','finance','finances','financial','financing','find','findarticles','finder','finding','findings','findlaw','finds','fine','finest','finger','fingering','fingers','finish','finished','finishing','finite','finland','finnish','fioricet','fire','fired','firefox','fireplace','fires','firewall','firewire','firm','firms','firmware','first','fiscal','fish','fisher','fisheries','fishing','fist','fisting','fit','fitness','fits',
    'fitted','fitting','five','fix','fixed','fixes','fixtures','fl','fla','flag','flags','flame','flash','flashers','flashing','flat','flavor','fleece','fleet','flesh','flex','flexibility','flexible','flickr','flight','flights','flip','float','floating','flood','floor','flooring','floors','floppy','floral','florence','florida','florist','florists','flour','flow','flower','flowers','flows','floyd','flu','fluid','flush','flux','fly','flyer','flying','fm','fo','foam','focal','focus','focused','focuses','focusing','fog','fold','folder','folders','folding','folk','folks','follow','followed','following','follows','font','fonts','foo','food','foods','fool','foot','footage','football','footwear','for','forbes','forbidden','force','forced','forces','ford','forecast','forecasts','foreign','forest','forestry','forests','forever','forge','forget','forgot','forgotten','fork',
    'form','formal','format','formation','formats','formatting','formed','former','formerly','forming','forms','formula','fort','forth','fortune','forty','forum','forums','forward','forwarding','fossil','foster','foto','fotos','fought','foul','found','foundation','foundations','founded','founder','fountain','four','fourth','fox','fp','fr','fraction','fragrance','fragrances','frame','framed','frames','framework','framing','france','franchise','francis','francisco','frank','frankfurt','franklin','fraser','fraud','fred','frederick','free','freebsd','freedom','freelance','freely','freeware','freeze','freight','french','frequencies','frequency','frequent','frequently','fresh','fri','friday','fridge','friend','friendly','friends','friendship','frog','from','front','frontier','frontpage','frost','frozen','fruit','fruits','fs','ft','ftp','fu','fuck','fucked','fucking','fuel','fuji','fujitsu','full','fully','fun','function',
    'functional','functionality','functioning','functions','fund','fundamental','fundamentals','funded','funding','fundraising','funds','funeral','funk','funky','funny','fur','furnished','furnishings','furniture','further','furthermore','fusion','future','futures','fuzzy','fw','fwd','fx','fy','g','ga','gabriel','gadgets','gage','gain','gained','gains','galaxy','gale','galleries','gallery','gambling','game','gamecube','games','gamespot','gaming','gamma','gang','gangbang','gap','gaps','garage','garbage','garcia','garden','gardening','gardens','garlic','garmin','gary','gas','gasoline','gate','gates','gateway','gather','gathered','gathering','gauge','gave','gay','gays','gazette','gb','gba','gbp','gc','gcc','gd','gdp','ge','gear','geek','gel','gem','gen','gender','gene','genealogy','general','generally','generate','generated','generates','generating','generation','generations','generator','generators',
    'generic','generous','genes','genesis','genetic','genetics','geneva','genius','genome','genre','genres','gentle','gentleman','gently','genuine','geo','geographic','geographical','geography','geological','geology','geometry','george','georgia','gerald','german','germany','get','gets','getting','gg','ghana','ghost','ghz','gi','giant','giants','gibraltar','gibson','gif','gift','gifts','gig','gilbert','girl','girlfriend','girls','gis','give','given','gives','giving','gl','glad','glance','glasgow','glass','glasses','glen','glenn','global','globe','glory','glossary','gloves','glow','glucose','gm','gmbh','gmc','gmt','gnome','gnu','go','goal','goals','goat','god','gods','goes','going','gold','golden','golf','gone','gonna','good','goods','google','gordon','gore','gorgeous','gospel','gossip','got','gothic','goto','gotta','gotten','gourmet',
    'gov','governance','governing','government','governmental','governments','governor','govt','gp','gpl','gps','gr','grab','grace','grad','grade','grades','gradually','graduate','graduated','graduates','graduation','graham','grain','grammar','grams','grand','grande','granny','grant','granted','grants','graph','graphic','graphical','graphics','graphs','gras','grass','grateful','gratis','gratuit','grave','gravity','gray','great','greater','greatest','greatly','greece','greek','green','greene','greenhouse','greensboro','greeting','greetings','greg','gregory','grenada','grew','grey','grid','griffin','grill','grip','grocery','groove','gross','ground','grounds','groundwater','group','groups','grove','grow','growing','grown','grows','growth','gs','gsm','gst','gt','gtk','guam','guarantee','guaranteed','guarantees','guard','guardian','guards','guatemala','guess','guest','guestbook','guests','gui','guidance','guide',
    'guided','guidelines','guides','guild','guilty','guinea','guitar','guitars','gulf','gun','guns','guru','guy','guyana','guys','gym','gzip','h','ha','habitat','habits','hack','hacker','had','hair','hairy','haiti','half','halfcom','halifax','hall','halloween','halo','ham','hamburg','hamilton','hammer','hampshire','hampton','hand','handbags','handbook','handed','handheld','handhelds','handjob','handjobs','handle','handled','handles','handling','handmade','hands','handy','hang','hanging','hans','hansen','happen','happened','happening','happens','happiness','happy','harassment','harbor','harbour','hard','hardcore','hardcover','harder','hardly','hardware','hardwood','harley','harm','harmful','harmony','harold','harper','harris','harrison','harry','hart','hartford','harvard','harvest','harvey','has','hash','hat','hate','hats','have','haven','having','hawaii','hawaiian','hawk','hay',
    'hayes','hazard','hazardous','hazards','hb','hc','hd','hdtv','he','head','headed','header','headers','heading','headline','headlines','headphones','headquarters','heads','headset','healing','health','healthcare','healthy','hear','heard','hearing','hearings','heart','hearts','heat','heated','heater','heath','heather','heating','heaven','heavily','heavy','hebrew','heel','height','heights','held','helen','helena','helicopter','hell','hello','helmet','help','helped','helpful','helping','helps','hence','henderson','henry','hentai','hepatitis','her','herald','herb','herbal','herbs','here','hereby','herein','heritage','hero','heroes','herself','hewlett','hey','hh','hi','hidden','hide','hierarchy','high','higher','highest','highland','highlight','highlighted','highlights','highly','highs','highway','highways','hiking','hill','hills','hilton','him','himself','hindu','hint','hints','hip',
    'hire','hired','hiring','his','hispanic','hist','historic','historical','history','hit','hitachi','hits','hitting','hiv','hk','hl','ho','hobbies','hobby','hockey','hold','holdem','holder','holders','holding','holdings','holds','hole','holes','holiday','holidays','holland','hollow','holly','hollywood','holmes','holocaust','holy','home','homeland','homeless','homepage','homes','hometown','homework','hon','honda','honduras','honest','honey','hong','honolulu','honor','honors','hood','hook','hop','hope','hoped','hopefully','hopes','hoping','hopkins','horizon','horizontal','hormone','horn','horny','horrible','horror','horse','horses','hose','hospital','hospitality','hospitals','host','hosted','hostel','hostels','hosting','hosts','hot','hotel','hotels','hotelscom','hotmail','hottest','hour','hourly','hours','house','household','households','houses','housewares','housewives','housing','houston','how',
    'howard','however','howto','hp','hq','hr','href','hrs','hs','ht','html','http','hu','hub','hudson','huge','hugh','hughes','hugo','hull','human','humanitarian','humanities','humanity','humans','humidity','humor','hundred','hundreds','hung','hungarian','hungary','hunger','hungry','hunt','hunter','hunting','huntington','hurricane','hurt','husband','hwy','hybrid','hydraulic','hydrocodone','hydrogen','hygiene','hypothesis','hypothetical','hyundai','hz','i','ia','ian','ibm','ic','ice','iceland','icon','icons','icq','ict','id','idaho','ide','idea','ideal','ideas','identical','identification','identified','identifier','identifies','identify','identifying','identity','idle','idol','ids','ie','ieee','if','ignore','ignored','ii','iii','il','ill','illegal','illinois','illness','illustrated','illustration','illustrations','im','ima','image','images','imagination','imagine',
    'imaging','img','immediate','immediately','immigrants','immigration','immune','immunology','impact','impacts','impaired','imperial','implement','implementation','implemented','implementing','implications','implied','implies','import','importance','important','importantly','imported','imports','impose','imposed','impossible','impressed','impression','impressive','improve','improved','improvement','improvements','improving','in','inappropriate','inbox','inc','incentive','incentives','incest','inch','inches','incidence','incident','incidents','incl','include','included','includes','including','inclusion','inclusive','income','incoming','incomplete','incorporate','incorporated','incorrect','increase','increased','increases','increasing','increasingly','incredible','incurred','ind','indeed','independence','independent','independently','index','indexed','indexes','india','indian','indiana','indianapolis','indians','indicate','indicated','indicates','indicating','indication','indicator','indicators','indices','indie','indigenous','indirect','individual','individually','individuals','indonesia','indonesian','indoor','induced','induction',
    'industrial','industries','industry','inexpensive','inf','infant','infants','infected','infection','infections','infectious','infinite','inflation','influence','influenced','influences','info','inform','informal','information','informational','informative','informed','infrared','infrastructure','ing','ingredients','inherited','initial','initially','initiated','initiative','initiatives','injection','injured','injuries','injury','ink','inkjet','inline','inn','inner','innocent','innovation','innovations','innovative','inns','input','inputs','inquire','inquiries','inquiry','ins','insects','insert','inserted','insertion','inside','insider','insight','insights','inspection','inspections','inspector','inspiration','inspired','install','installation','installations','installed','installing','instance','instances','instant','instantly','instead','institute','institutes','institution','institutional','institutions','instruction','instructional','instructions','instructor','instructors','instrument','instrumental','instrumentation','instruments','insulin','insurance','insured','int','intake','integer','integral','integrate','integrated','integrating',
    'integration','integrity','intel','intellectual','intelligence','intelligent','intend','intended','intense','intensity','intensive','intent','intention','inter','interact','interaction','interactions','interactive','interest','interested','interesting','interests','interface','interfaces','interference','interim','interior','intermediate','internal','international','internationally','internet','internship','interpretation','interpreted','interracial','intersection','interstate','interval','intervals','intervention','interventions','interview','interviews','intimate','intl','into','intranet','intro','introduce','introduced','introduces','introducing','introduction','introductory','invalid','invasion','invention','inventory','invest','investigate','investigated','investigation','investigations','investigator','investigators','investing','investment','investments','investor','investors','invisible','invision','invitation','invitations','invite','invited','invoice','involve','involved','involvement','involves','involving','io','ion','iowa','ip','ipaq','ipod','ips','ir','ira','iran','iraq','iraqi','irc','ireland','irish','iron','irrigation',
    'irs','is','isa','isaac','isbn','islam','islamic','island','islands','isle','iso','isolated','isolation','isp','israel','israeli','issn','issue','issued','issues','ist','istanbul','it','italia','italian','italiano','italic','italy','item','items','its','itsa','itself','itunes','iv','ivory','ix','j','ja','jack','jacket','jackets','jackie','jackson','jacksonville','jacob','jade','jaguar','jail','jake','jam','jamaica','james','jamie','jan','jane','janet','january','japan','japanese','jar','jason','java','javascript','jay','jazz','jc','jd','je','jean','jeans','jeep','jeff','jefferson','jeffrey','jelsoft','jennifer','jenny','jeremy','jerry','jersey','jerusalem','jesse','jessica','jesus','jet','jets','jewel','jewellery','jewelry','jewish','jews','jill','jim','jimmy','jj','jm','jo','joan','job', 
    'jobs','joe','joel','john','johnny','johns','johnson','johnston','join','joined','joining','joins','joint','joke','jokes','jon','jonathan','jones','jordan','jose','joseph','josh','joshua','journal','journalism','journalist','journalists','journals','journey','joy','joyce','jp','jpeg','jpg','jr','js','juan','judge','judges','judgment','judicial','judy','juice','jul','julia','julian','julie','july','jump','jumping','jun','junction','june','jungle','junior','junk','jurisdiction','jury','just','justice','justify','justin','juvenile','jvc','k','ka','kai','kansas','karaoke','karen','karl','karma','kate','kathy','katie','katrina','kay','kazakhstan','kb','kde','keen','keep','keeping','keeps','keith','kelkoo','kelly','ken','kennedy','kenneth','kenny','keno','kent','kentucky','kenya','kept','kernel','kerry','kevin','key',
    'keyboard','keyboards','keys','keyword','keywords','kg','kick','kid','kidney','kids','kijiji','kill','killed','killer','killing','kills','kilometers','kim','kinase','kind','kinda','kinds','king','kingdom','kings','kingston','kirk','kiss','kissing','kit','kitchen','kits','kitty','klein','km','knee','knew','knife','knight','knights','knit','knitting','knives','knock','know','knowing','knowledge','knowledgestorm','known','knows','ko','kodak','kong','korea','korean','kruger','ks','kurt','kuwait','kw','ky','kyle','l','la','lab','label','labeled','labels','labor','laboratories','laboratory','labour','labs','lace','lack','ladder','laden','ladies','lady','lafayette','laid','lake','lakes','lamb','lambda','lamp','lamps','lan','lancaster','lance','land','landing','lands','landscape','landscapes','lane','lanes','lang','language','languages',
    'lanka','lap','laptop','laptops','large','largely','larger','largest','larry','las','laser','last','lasting','lat','late','lately','later','latest','latex','latin','latina','latinas','latino','latitude','latter','latvia','lauderdale','laugh','laughing','launch','launched','launches','laundry','laura','lauren','law','lawn','lawrence','laws','lawsuit','lawyer','lawyers','lay','layer','layers','layout','lazy','lb','lbs','lc','lcd','ld','le','lead','leader','leaders','leadership','leading','leads','leaf','league','lean','learn','learned','learners','learning','lease','leasing','least','leather','leave','leaves','leaving','lebanon','lecture','lectures','led','lee','leeds','left','leg','legacy','legal','legally','legend','legendary','legends','legislation','legislative','legislature','legitimate','legs','leisure','lemon','len','lender','lenders','lending','length','lens',
    'lenses','leo','leon','leonard','leone','les','lesbian','lesbians','leslie','less','lesser','lesson','lessons','let','lets','letter','letters','letting','leu','level','levels','levitra','levy','lewis','lexington','lexmark','lexus','lf','lg','li','liabilities','liability','liable','lib','liberal','liberia','liberty','librarian','libraries','library','libs','licence','license','licensed','licenses','licensing','licking','lid','lie','liechtenstein','lies','life','lifestyle','lifetime','lift','light','lighter','lighting','lightning','lights','lightweight','like','liked','likelihood','likely','likes','likewise','lil','lime','limit','limitation','limitations','limited','limiting','limits','limousines','lincoln','linda','lindsay','line','linear','lined','lines','lingerie','link','linked','linking','links','linux','lion','lions','lip','lips','liquid','lisa','list','listed','listen','listening','listing',
    'listings','listprice','lists','lit','lite','literacy','literally','literary','literature','lithuania','litigation','little','live','livecam','lived','liver','liverpool','lives','livesex','livestock','living','liz','ll','llc','lloyd','llp','lm','ln','lo','load','loaded','loading','loads','loan','loans','lobby','loc','local','locale','locally','locate','located','location','locations','locator','lock','locked','locking','locks','lodge','lodging','log','logan','logged','logging','logic','logical','login','logistics','logitech','logo','logos','logs','lol','lolita','london','lone','lonely','long','longer','longest','longitude','look','looked','looking','looks','looksmart','lookup','loop','loops','loose','lopez','lord','los','lose','losing','loss','losses','lost','lot','lots','lottery','lotus','lou','loud','louis','louise','louisiana','louisville','lounge',
    'love','loved','lovely','lover','lovers','loves','loving','low','lower','lowest','lows','lp','ls','lt','ltd','lu','lucas','lucia','luck','lucky','lucy','luggage','luis','luke','lunch','lung','luther','luxembourg','luxury','lycos','lying','lynn','lyric','lyrics','m','ma','mac','macedonia','machine','machinery','machines','macintosh','macro','macromedia','mad','madagascar','made','madison','madness','madonna','madrid','mae','mag','magazine','magazines','magic','magical','magnet','magnetic','magnificent','magnitude','mai','maiden','mail','mailed','mailing','mailman','mails','mailto','main','maine','mainland','mainly','mainstream','maintain','maintained','maintaining','maintains','maintenance','major','majority','make','maker','makers','makes','makeup','making','malawi','malaysia','maldives','male','males','mali','mall','malpractice','malta','mambo','man','manage','managed',
    'management','manager','managers','managing','manchester','mandate','mandatory','manga','manhattan','manitoba','manner','manor','manual','manually','manuals','manufacture','manufactured','manufacturer','manufacturers','manufacturing','many','map','maple','mapping','maps','mar','marathon','marble','marc','march','marco','marcus','mardi','margaret','margin','maria','mariah','marie','marijuana','marilyn','marina','marine','mario','marion','maritime','mark','marked','marker','markers','market','marketing','marketplace','markets','marking','marks','marriage','married','marriott','mars','marshall','mart','martha','martial','martin','marvel','mary','maryland','mas','mask','mason','mass','massachusetts','massage','massive','master','mastercard','masters','masturbating','masturbation','mat','match','matched','matches','matching','mate','material','materials','maternity','math','mathematical','mathematics','mating','matrix','mats','matt','matter','matters','matthew','mattress','mature',
    'maui','mauritius','max','maximize','maximum','may','maybe','mayor','mazda','mb','mba','mc','mcdonald','md','me','meal','meals','mean','meaning','meaningful','means','meant','meanwhile','measure','measured','measurement','measurements','measures','measuring','meat','mechanical','mechanics','mechanism','mechanisms','med','medal','media','median','medicaid','medical','medicare','medication','medications','medicine','medicines','medieval','meditation','mediterranean','medium','medline','meet','meeting','meetings','meets','meetup','mega','mel','melbourne','melissa','mem','member','members','membership','membrane','memo','memorabilia','memorial','memories','memory','memphis','men','mens','ment','mental','mention','mentioned','mentor','menu','menus','mercedes','merchandise','merchant','merchants','mercury','mercy','mere','merely','merge','merger','merit','merry','mesa','mesh','mess','message','messages','messaging','messenger','met','meta',
    'metabolism','metadata','metal','metallic','metallica','metals','meter','meters','method','methodology','methods','metres','metric','metro','metropolitan','mexican','mexico','meyer','mf','mfg','mg','mh','mhz','mi','mia','miami','mic','mice','michael','michel','michelle','michigan','micro','microphone','microsoft','microwave','mid','middle','midi','midlands','midnight','midwest','might','mighty','migration','mike','mil','milan','mild','mile','mileage','miles','milf','milfhunter','milfs','military','milk','mill','millennium','miller','million','millions','mills','milton','milwaukee','mime','min','mind','minds','mine','mineral','minerals','mines','mini','miniature','minimal','minimize','minimum','mining','minister','ministers','ministries','ministry','minneapolis','minnesota','minolta','minor','minority','mins','mint','minus','minute','minutes','miracle','mirror','mirrors','misc','miscellaneous','miss','missed',
    'missile','missing','mission','missions','mississippi','missouri','mistake','mistakes','mistress','mit','mitchell','mitsubishi','mix','mixed','mixer','mixing','mixture','mj','ml','mlb','mls','mm','mn','mo','mobile','mobiles','mobility','mod','mode','model','modeling','modelling','models','modem','modems','moderate','moderator','moderators','modern','modes','modification','modifications','modified','modify','mods','modular','module','modules','moisture','mold','moldova','molecular','molecules','mom','moment','moments','momentum','moms','mon','monaco','monday','monetary','money','mongolia','monica','monitor','monitored','monitoring','monitors','monkey','mono','monroe','monster','montana','monte','montgomery','month','monthly','months','montreal','mood','moon','moore','moral','more','moreover','morgan','morning','morocco','morris','morrison','mortality','mortgage','mortgages','moscow','moses','moss','most','mostly','motel',
    'motels','mother','motherboard','mothers','motion','motivated','motivation','motor','motorcycle','motorcycles','motorola','motors','mount','mountain','mountains','mounted','mounting','mounts','mouse','mouth','move','moved','movement','movements','movers','moves','movie','movies','moving','mozambique','mozilla','mp','mpeg','mpegs','mpg','mph','mr','mrna','mrs','ms','msg','msgid','msgstr','msie','msn','mt','mtv','mu','much','mud','mug','multi','multimedia','multiple','mumbai','munich','municipal','municipality','murder','murphy','murray','muscle','muscles','museum','museums','music','musical','musician','musicians','muslim','muslims','must','mustang','mutual','muze','mv','mw','mx','my','myanmar','myers','myrtle','myself','mysimon','myspace','mysql','mysterious','mystery','myth','n','na','nail','nails','naked','nam','name','named','namely','names','namespace',
    'namibia','nancy','nano','naples','narrative','narrow','nasa','nascar','nasdaq','nashville','nasty','nat','nathan','nation','national','nationally','nations','nationwide','native','nato','natural','naturally','naturals','nature','naughty','nav','naval','navigate','navigation','navigator','navy','nb','nba','nbc','nc','ncaa','nd','ne','near','nearby','nearest','nearly','nebraska','nec','necessarily','necessary','necessity','neck','necklace','need','needed','needle','needs','negative','negotiation','negotiations','neighbor','neighborhood','neighbors','neil','neither','nelson','neo','neon','nepal','nerve','nervous','nest','nested','net','netherlands','netscape','network','networking','networks','neural','neutral','nevada','never','nevertheless','new','newark','newbie','newcastle','newer','newest','newfoundland','newly','newport','news','newscom','newsletter','newsletters','newspaper','newspapers','newton','next','nextel','nfl','ng',
    'nh','nhl','nhs','ni','niagara','nicaragua','nice','nicholas','nick','nickel','nickname','nicole','niger','nigeria','night','nightlife','nightmare','nights','nike','nikon','nil','nine','nintendo','nipple','nipples','nirvana','nissan','nitrogen','nj','nl','nm','nn','no','noble','nobody','node','nodes','noise','nokia','nominated','nomination','nominations','non','none','nonprofit','noon','nor','norfolk','norm','normal','normally','norman','north','northeast','northern','northwest','norton','norway','norwegian','nos','nose','not','note','notebook','notebooks','noted','notes','nothing','notice','noticed','notices','notification','notifications','notified','notify','notion','notre','nottingham','nov','nova','novel','novels','novelty','november','now','nowhere','np','nr','ns','nsw','nt','ntsc','nu','nuclear','nude','nudist','nudity','nuke','null','number',
    'numbers','numeric','numerical','numerous','nurse','nursery','nurses','nursing','nut','nutrition','nutritional','nuts','nutten','nv','nvidia','nw','ny','nyc','nylon','nz','o','oak','oakland','oaks','oasis','ob','obesity','obituaries','obj','object','objective','objectives','objects','obligation','obligations','observation','observations','observe','observed','observer','obtain','obtained','obtaining','obvious','obviously','oc','occasion','occasional','occasionally','occasions','occupation','occupational','occupations','occupied','occur','occurred','occurrence','occurring','occurs','ocean','oclc','oct','october','odd','odds','oe','oecd','oem','of','off','offense','offensive','offer','offered','offering','offerings','offers','office','officer','officers','offices','official','officially','officials','offline','offset','offshore','often','og','oh','ohio','oil','oils','ok','okay','oklahoma','ol','old','older','oldest',
    'olive','oliver','olympic','olympics','olympus','om','omaha','oman','omega','omissions','on','once','one','ones','ongoing','onion','online','only','ons','ontario','onto','oo','ooo','oops','op','open','opened','opening','openings','opens','opera','operate','operated','operates','operating','operation','operational','operations','operator','operators','opinion','opinions','opponent','opponents','opportunities','opportunity','opposed','opposite','opposition','opt','optical','optics','optimal','optimization','optimize','optimum','option','optional','options','or','oracle','oral','orange','orbit','orchestra','order','ordered','ordering','orders','ordinance','ordinary','oregon','org','organ','organic','organisation','organisations','organised','organisms','organization','organizational','organizations','organize','organized','organizer','organizing','orgasm','orgy','oriental','orientation','oriented','origin','original','originally','origins','orlando','orleans','os','oscar','ot',
    'other','others','otherwise','ottawa','ou','ought','our','ours','ourselves','out','outcome','outcomes','outdoor','outdoors','outer','outlet','outline','outlined','outlook','output','outputs','outreach','outside','outsourcing','outstanding','oval','oven','over','overall','overcome','overhead','overnight','overseas','overview','owen','own','owned','owner','owners','ownership','owns','oxford','oxide','oxygen','oz','ozone','p','pa','pac','pace','pacific','pack','package','packages','packaging','packard','packed','packet','packets','packing','packs','pad','pads','page','pages','paid','pain','painful','paint','paintball','painted','painting','paintings','pair','pairs','pakistan','pal','palace','pale','palestine','palestinian','palm','palmer','pam','pamela','pan','panama','panasonic','panel','panels','panic','panties','pants','pantyhose','paper','paperback','paperbacks','papers','papua','par',
    'para','parade','paradise','paragraph','paragraphs','paraguay','parallel','parameter','parameters','parcel','parent','parental','parenting','parents','paris','parish','park','parker','parking','parks','parliament','parliamentary','part','partial','partially','participant','participants','participate','participated','participating','participation','particle','particles','particular','particularly','parties','partition','partly','partner','partners','partnership','partnerships','parts','party','pas','paso','pass','passage','passed','passenger','passengers','passes','passing','passion','passive','passport','password','passwords','past','pasta','paste','pastor','pat','patch','patches','patent','patents','path','pathology','paths','patient','patients','patio','patricia','patrick','patrol','pattern','patterns','paul','pavilion','paxil','pay','payable','payday','paying','payment','payments','paypal','payroll','pays','pb','pc','pci','pcs','pct','pd','pda','pdas','pdf','pdt',
    'pe','peace','peaceful','peak','pearl','peas','pediatric','pee','peeing','peer','peers','pen','penalties','penalty','pencil','pendant','pending','penetration','penguin','peninsula','penis','penn','pennsylvania','penny','pens','pension','pensions','pentium','people','peoples','pepper','per','perceived','percent','percentage','perception','perfect','perfectly','perform','performance','performances','performed','performer','performing','performs','perfume','perhaps','period','periodic','periodically','periods','peripheral','peripherals','perl','permalink','permanent','permission','permissions','permit','permits','permitted','perry','persian','persistent','person','personal','personality','personalized','personally','personals','personnel','persons','perspective','perspectives','perth','peru','pest','pet','pete','peter','petersburg','peterson','petite','petition','petroleum','pets','pf','pg','pgp','ph','phantom','pharmaceutical','pharmaceuticals','pharmacies','pharmacology','pharmacy','phase','phases','phd','phenomenon',
    'phentermine','phi','phil','philadelphia','philip','philippines','philips','phillips','philosophy','phoenix','phone','phones','photo','photograph','photographer','photographers','photographic','photographs','photography','photos','photoshop','php','phpbb','phrase','phrases','phys','physical','physically','physician','physicians','physics','physiology','pi','piano','pic','pichunter','pick','picked','picking','picks','pickup','picnic','pics','picture','pictures','pie','piece','pieces','pierce','pierre','pig','pike','pill','pillow','pills','pilot','pin','pine','ping','pink','pins','pioneer','pipe','pipeline','pipes','pirates','piss','pissing','pit','pitch','pittsburgh','pix','pixel','pixels','pizza','pj','pk','pl','place','placed','placement','places','placing','plain','plains','plaintiff','plan','plane','planes','planet','planets','planned','planner','planners','planning','plans','plant','plants','plasma','plastic',
    'plastics','plate','plates','platform','platforms','platinum','play','playback','playboy','played','player','players','playing','playlist','plays','playstation','plaza','plc','pleasant','please','pleased','pleasure','pledge','plenty','plot','plots','plug','plugin','plugins','plumbing','plus','plymouth','pm','pmc','pmid','pn','po','pocket','pockets','pod','podcast','podcasts','poem','poems','poet','poetry','point','pointed','pointer','pointing','points','pokemon','poker','poland','polar','pole','police','policies','policy','polish','polished','political','politicians','politics','poll','polls','pollution','polo','poly','polyester','polymer','polyphonic','pond','pontiac','pool','pools','poor','pop','pope','popular','popularity','population','populations','por','porcelain','pork','porn','porno','porsche','port','portable','portal','porter','portfolio','portion','portions','portland','portrait','portraits','ports',
    'portsmouth','portugal','portuguese','pos','pose','posing','position','positioning','positions','positive','possess','possession','possibilities','possibility','possible','possibly','post','postage','postal','postcard','postcards','posted','poster','posters','posting','postings','postposted','posts','pot','potato','potatoes','potential','potentially','potter','pottery','poultry','pound','pounds','pour','poverty','powder','powell','power','powered','powerful','powerpoint','powers','powerseller','pp','ppc','ppm','pr','practical','practice','practices','practitioner','practitioners','prague','prairie','praise','pray','prayer','prayers','pre','preceding','precious','precipitation','precise','precisely','precision','predict','predicted','prediction','predictions','prefer','preference','preferences','preferred','prefers','prefix','pregnancy','pregnant','preliminary','premier','premiere','premises','premium','prep','prepaid','preparation','prepare','prepared','preparing','prerequisite','prescribed','prescription','presence','present','presentation','presentations',
    'presented','presenting','presently','presents','preservation','preserve','president','presidential','press','pressed','pressing','pressure','preston','pretty','prev','prevent','preventing','prevention','preview','previews','previous','previously','price','priced','prices','pricing','pride','priest','primarily','primary','prime','prince','princess','princeton','principal','principle','principles','print','printable','printed','printer','printers','printing','prints','prior','priorities','priority','prison','prisoner','prisoners','privacy','private','privilege','privileges','prix','prize','prizes','pro','probability','probably','probe','problem','problems','proc','procedure','procedures','proceed','proceeding','proceedings','proceeds','process','processed','processes','processing','processor','processors','procurement','produce','produced','producer','producers','produces','producing','product','production','productions','productive','productivity','products','prof','profession','professional','professionals','professor','profile','profiles','profit','profits','program','programme',
    'programmer','programmers','programmes','programming','programs','progress','progressive','prohibited','project','projected','projection','projector','projectors','projects','prominent','promise','promised','promises','promising','promo','promote','promoted','promotes','promoting','promotion','promotional','promotions','prompt','promptly','proof','propecia','proper','properly','properties','property','prophet','proportion','proposal','proposals','propose','proposed','proposition','proprietary','pros','prospect','prospective','prospects','prostate','prostores','prot','protect','protected','protecting','protection','protective','protein','proteins','protest','protocol','protocols','prototype','proud','proudly','prove','proved','proven','provide','provided','providence','provider','providers','provides','providing','province','provinces','provincial','provision','provisions','proxy','prozac','ps','psi','psp','pst','psychiatry','psychological','psychology','pt','pts','pty','pub','public','publication','publications','publicity','publicly','publish','published','publisher','publishers',
    'publishing','pubmed','pubs','puerto','pull','pulled','pulling','pulse','pump','pumps','punch','punishment','punk','pupils','puppy','purchase','purchased','purchases','purchasing','pure','purple','purpose','purposes','purse','pursuant','pursue','pursuit','push','pushed','pushing','pussy','put','puts','putting','puzzle','puzzles','pvc','python','q','qatar','qc','qld','qt','qty','quad','qualification','qualifications','qualified','qualify','qualifying','qualities','quality','quantitative','quantities','quantity','quantum','quarter','quarterly','quarters','que','quebec','queen','queens','queensland','queries','query','quest','question','questionnaire','questions','queue','qui','quick','quickly','quiet','quilt','quit','quite','quiz','quizzes','quotations','quote','quoted','quotes','r','ra','rabbit','race','races','rachel','racial','racing','rack','racks','radar','radiation','radical','radio','radios','radius',
    'rage','raid','rail','railroad','railway','rain','rainbow','raise','raised','raises','raising','raleigh','rally','ralph','ram','ran','ranch','rand','random','randy','range','rangers','ranges','ranging','rank','ranked','ranking','rankings','ranks','rap','rape','rapid','rapidly','rapids','rare','rarely','rat','rate','rated','rates','rather','rating','ratings','ratio','rational','ratios','rats','raw','ray','raymond','rays','rb','rc','rca','rd','re','reach','reached','reaches','reaching','reaction','reactions','read','reader','readers','readily','reading','readings','reads','ready','real','realistic','reality','realize','realized','really','realm','realtor','realtors','realty','rear','reason','reasonable','reasonably','reasoning','reasons','rebate','rebates','rebecca','rebel','rebound','rec','recall','receipt','receive','received','receiver','receivers','receives','receiving',
    'recent','recently','reception','receptor','receptors','recipe','recipes','recipient','recipients','recognised','recognition','recognize','recognized','recommend','recommendation','recommendations','recommended','recommends','reconstruction','record','recorded','recorder','recorders','recording','recordings','records','recover','recovered','recovery','recreation','recreational','recruiting','recruitment','recycling','red','redeem','redhead','reduce','reduced','reduces','reducing','reduction','reductions','reed','reef','reel','ref','refer','reference','referenced','references','referral','referrals','referred','referring','refers','refinance','refine','refined','reflect','reflected','reflection','reflections','reflects','reform','reforms','refresh','refrigerator','refugees','refund','refurbished','refuse','refused','reg','regard','regarded','regarding','regardless','regards','reggae','regime','region','regional','regions','register','registered','registrar','registration','registry','regression','regular','regularly','regulated','regulation','regulations','regulatory','rehab','rehabilitation','reid','reject',
    'rejected','rel','relate','related','relates','relating','relation','relations','relationship','relationships','relative','relatively','relatives','relax','relaxation','relay','release','released','releases','relevance','relevant','reliability','reliable','reliance','relief','religion','religions','religious','reload','relocation','rely','relying','remain','remainder','remained','remaining','remains','remark','remarkable','remarks','remedies','remedy','remember','remembered','remind','reminder','remix','remote','removable','removal','remove','removed','removing','renaissance','render','rendered','rendering','renew','renewable','renewal','reno','rent','rental','rentals','rentcom','rep','repair','repairs','repeat','repeated','replace','replaced','replacement','replacing','replica','replication','replied','replies','reply','report','reported','reporter','reporters','reporting','reports','repository','represent','representation','representations','representative','representatives','represented','representing','represents','reprint','reprints','reproduce','reproduced','reproduction','reproductive',
    'republic','republican','republicans','reputation','request','requested','requesting','requests','require','required','requirement','requirements','requires','requiring','res','rescue','research','researcher','researchers','reseller','reservation','reservations','reserve','reserved','reserves','reservoir','reset','residence','resident','residential','residents','resist','resistance','resistant','resolution','resolutions','resolve','resolved','resort','resorts','resource','resources','respect','respected','respective','respectively','respiratory','respond','responded','respondent','respondents','responding','response','responses','responsibilities','responsibility','responsible','rest','restaurant','restaurants','restoration','restore','restored','restrict','restricted','restriction','restrictions','restructuring','result','resulted','resulting','results','resume','resumes','retail','retailer','retailers','retain','retained','retention','retired','retirement','retreat','retrieval','retrieve','retrieved','retro','return','returned','returning','returns','reunion','reuters','rev','reveal','revealed','reveals','revelation','revenge','revenue',
    'revenues','reverse','review','reviewed','reviewer','reviewing','reviews','revised','revision','revisions','revolution','revolutionary','reward','rewards','reynolds','rf','rfc','rg','rh','rhode','rhythm','ri','ribbon','rica','rice','rich','richard','richards','richardson','richmond','rick','rico','rid','ride','rider','riders','rides','ridge','riding','right','rights','rim','ring','rings','ringtone','ringtones','rio','rip','ripe','rise','rising','risk','risks','river','rivers','riverside','rj','rl','rm','rn','rna','ro','road','roads','rob','robert','roberts','robertson','robin','robinson','robot','robots','robust','rochester','rock','rocket','rocks','rocky','rod','roger','rogers','roland','role','roles','roll','rolled','roller','rolling','rolls','rom','roman','romance','romania','romantic','rome','ron','ronald','roof','room','roommate',
    'roommates','rooms','root','roots','rope','rosa','rose','roses','ross','roster','rotary','rotation','rouge','rough','roughly','roulette','round','rounds','route','router','routers','routes','routine','routines','routing','rover','row','rows','roy','royal','royalty','rp','rpg','rpm','rr','rrp','rs','rss','rt','ru','rubber','ruby','rug','rugby','rugs','rule','ruled','rules','ruling','run','runner','running','runs','runtime','rural','rush','russell','russia','russian','ruth','rv','rw','rwanda','rx','ryan','s','sa','sacramento','sacred','sacrifice','sad','saddam','safari','safe','safely','safer','safety','sage','sagem','said','sail','sailing','saint','saints','sake','salad','salaries','salary','sale','salem','sales','sally','salmon','salon','salt','salvador','salvation','sam','samba','same',  
    'samoa','sample','samples','sampling','samsung','samuel','san','sand','sandra','sandwich','sandy','sans','santa','sanyo','sao','sap','sapphire','sara','sarah','sas','saskatchewan','sat','satellite','satin','satisfaction','satisfactory','satisfied','satisfy','saturday','saturn','sauce','saudi','savage','savannah','save','saved','saver','saves','saving','savings','saw','say','saying','says','sb','sbjct','sc','scale','scales','scan','scanned','scanner','scanners','scanning','scary','scenario','scenarios','scene','scenes','scenic','schedule','scheduled','schedules','scheduling','schema','scheme','schemes','scholar','scholars','scholarship','scholarships','school','schools','sci','science','sciences','scientific','scientist','scientists','scoop','scope','score','scored','scores','scoring','scotia','scotland','scott','scottish','scout','scratch','screen','screening','screens','screensaver','screensavers','screenshot','screenshots','screw','script',    
    'scripting','scripts','scroll','scsi','scuba','sculpture','sd','se','sea','seafood','seal','sealed','sean','search','searchcom','searched','searches','searching','seas','season','seasonal','seasons','seat','seating','seats','seattle','sec','second','secondary','seconds','secret','secretariat','secretary','secrets','section','sections','sector','sectors','secure','secured','securely','securities','security','see','seed','seeds','seeing','seek','seeker','seekers','seeking','seeks','seem','seemed','seems','seen','sees','sega','segment','segments','select','selected','selecting','selection','selections','selective','self','sell','seller','sellers','selling','sells','semester','semi','semiconductor','seminar','seminars','sen','senate','senator','senators','send','sender','sending','sends','senegal','senior','seniors','sense','sensitive','sensitivity','sensor','sensors','sent','sentence','sentences','seo','sep','separate','separated',
    'separately','separation','sept','september','seq','sequence','sequences','ser','serbia','serial','series','serious','seriously','serum','serve','served','server','servers','serves','service','services','serving','session','sessions','set','sets','setting','settings','settle','settled','settlement','setup','seven','seventh','several','severe','sewing','sex','sexcam','sexo','sexual','sexuality','sexually','sexy','sf','sg','sh','shade','shades','shadow','shadows','shaft','shake','shakespeare','shakira','shall','shame','shanghai','shannon','shape','shaped','shapes','share','shared','shareholders','shares','shareware','sharing','shark','sharon','sharp','shaved','shaw','she','shed','sheep','sheer','sheet','sheets','sheffield','shelf','shell','shelter','shemale','shemales','shepherd','sheriff','sherman','shield','shift','shine','ship','shipment','shipments','shipped','shipping','ships','shirt','shirts','shit',
    'shock','shoe','shoes','shoot','shooting','shop','shopper','shoppercom','shoppers','shopping','shoppingcom','shops','shopzilla','shore','short','shortcuts','shorter','shortly','shorts','shot','shots','should','shoulder','show','showcase','showed','shower','showers','showing','shown','shows','showtimes','shut','shuttle','si','sic','sick','side','sides','sie','siemens','sierra','sig','sight','sigma','sign','signal','signals','signature','signatures','signed','significance','significant','significantly','signing','signs','signup','silence','silent','silicon','silk','silly','silver','sim','similar','similarly','simon','simple','simplified','simply','simpson','simpsons','sims','simulation','simulations','simultaneously','sin','since','sing','singapore','singer','singh','singing','single','singles','sink','sip','sir','sister','sisters','sit','site','sitemap','sites','sitting','situated','situation','situations','six','sixth',
    'size','sized','sizes','sk','skating','ski','skiing','skill','skilled','skills','skin','skins','skip','skirt','skirts','sku','sky','skype','sl','slave','sleep','sleeping','sleeps','sleeve','slide','slides','slideshow','slight','slightly','slim','slip','slope','slot','slots','slovak','slovakia','slovenia','slow','slowly','slut','sluts','sm','small','smaller','smart','smell','smile','smilies','smith','smithsonian','smoke','smoking','smooth','sms','smtp','sn','snake','snap','snapshot','snow','snowboard','so','soa','soap','soc','soccer','social','societies','society','sociology','socket','socks','sodium','sofa','soft','softball','software','soil','sol','solar','solaris','sold','soldier','soldiers','sole','solely','solid','solo','solomon','solution','solutions','solve','solved','solving','soma','somalia','some','somebody','somehow','someone',
    'somerset','something','sometimes','somewhat','somewhere','son','song','songs','sonic','sons','sony','soon','soonest','sophisticated','sorry','sort','sorted','sorts','sought','soul','souls','sound','sounds','soundtrack','soup','source','sources','south','southampton','southeast','southern','southwest','soviet','sox','sp','spa','space','spaces','spain','spam','span','spanish','spank','spanking','sparc','spare','spas','spatial','speak','speaker','speakers','speaking','speaks','spears','spec','special','specialist','specialists','specialized','specializing','specially','specials','specialties','specialty','species','specific','specifically','specification','specifications','specifics','specified','specifies','specify','specs','spectacular','spectrum','speech','speeches','speed','speeds','spell','spelling','spencer','spend','spending','spent','sperm','sphere','spice','spider','spies','spin','spine','spirit','spirits','spiritual','spirituality','split','spoke','spoken',
    'spokesman','sponsor','sponsored','sponsors','sponsorship','sport','sporting','sports','spot','spotlight','spots','spouse','spray','spread','spreading','spring','springer','springfield','springs','sprint','spy','spyware','sq','sql','squad','square','squirt','squirting','sr','src','sri','ss','ssl','st','stability','stable','stack','stadium','staff','staffing','stage','stages','stainless','stakeholders','stamp','stamps','stan','stand','standard','standards','standing','standings','stands','stanford','stanley','star','starring','stars','starsmerchant','start','started','starter','starting','starts','startup','stat','state','stated','statement','statements','states','statewide','static','stating','station','stationery','stations','statistical','statistics','stats','status','statute','statutes','statutory','stay','stayed','staying','stays','std','ste','steady','steal','steam','steel','steering','stem','step','stephanie','stephen','steps',
    'stereo','sterling','steve','steven','stevens','stewart','stick','sticker','stickers','sticks','sticky','still','stock','stockholm','stockings','stocks','stolen','stomach','stone','stones','stood','stop','stopped','stopping','stops','storage','store','stored','stores','stories','storm','story','str','straight','strain','strand','strange','stranger','strap','strategic','strategies','strategy','stream','streaming','streams','street','streets','strength','strengthen','strengthening','strengths','stress','stretch','strict','strictly','strike','strikes','striking','string','strings','strip','stripes','strips','stroke','strong','stronger','strongly','struck','struct','structural','structure','structured','structures','struggle','stuart','stuck','stud','student','students','studied','studies','studio','studios','study','studying','stuff','stuffed','stunning','stupid','style','styles','stylish','stylus','su','sub','subaru','subcommittee','subdivision','subject','subjects',
    'sublime','sublimedirectory','submission','submissions','submit','submitted','submitting','subscribe','subscriber','subscribers','subscription','subscriptions','subsection','subsequent','subsequently','subsidiaries','subsidiary','substance','substances','substantial','substantially','substitute','subtle','suburban','succeed','success','successful','successfully','such','suck','sucking','sucks','sudan','sudden','suddenly','sue','suffer','suffered','suffering','sufficient','sufficiently','sugar','suggest','suggested','suggesting','suggestion','suggestions','suggests','suicide','suit','suitable','suite','suited','suites','suits','sullivan','sum','summaries','summary','summer','summit','sun','sunday','sunglasses','sunny','sunrise','sunset','sunshine','super','superb','superintendent','superior','supervision','supervisor','supervisors','supplement','supplemental','supplements','supplied','supplier','suppliers','supplies','supply','support','supported','supporters','supporting','supports','suppose','supposed','supreme','sur','sure','surely','surf','surface','surfaces','surfing','surge','surgeon',
    'surgeons','surgery','surgical','surname','surplus','surprise','surprised','surprising','surrey','surround','surrounded','surrounding','surveillance','survey','surveys','survival','survive','survivor','survivors','susan','suse','suspect','suspected','suspended','suspension','sussex','sustainability','sustainable','sustained','suzuki','sv','sw','swap','sweden','swedish','sweet','swift','swim','swimming','swing','swingers','swiss','switch','switched','switches','switching','switzerland','sword','sydney','symantec','symbol','symbols','sympathy','symphony','symposium','symptoms','sync','syndicate','syndication','syndrome','synopsis','syntax','synthesis','synthetic','syracuse','syria','sys','system','systematic','systems','t','ta','tab','table','tables','tablet','tablets','tabs','tackle','tactics','tag','tagged','tags','tahoe','tail','taiwan','take','taken','takes','taking','tale','talent','talented','tales','talk','talked','talking','talks','tall','tamil',
    'tampa','tan','tank','tanks','tanzania','tap','tape','tapes','tar','target','targeted','targets','tariff','task','tasks','taste','tattoo','taught','tax','taxation','taxes','taxi','taylor','tb','tba','tc','tcp','td','te','tea','teach','teacher','teachers','teaches','teaching','team','teams','tear','tears','tech','technical','technician','technique','techniques','techno','technological','technologies','technology','techrepublic','ted','teddy','tee','teen','teenage','teens','teeth','tel','telecharger','telecom','telecommunications','telephone','telephony','telescope','television','televisions','tell','telling','tells','temp','temperature','temperatures','template','templates','temple','temporal','temporarily','temporary','ten','tenant','tend','tender','tennessee','tennis','tension','tent','term','terminal','terminals','termination','terminology','terms','terrace','terrain','terrible','territories','territory','terror','terrorism','terrorist','terrorists',
    'terry','test','testament','tested','testimonials','testimony','testing','tests','tex','texas','text','textbook','textbooks','textile','textiles','texts','texture','tf','tft','tgp','th','thai','thailand','than','thank','thanks','thanksgiving','that','thats','the','theater','theaters','theatre','thee','theft','thehun','their','them','theme','themes','themselves','then','theology','theorem','theoretical','theories','theory','therapeutic','therapist','therapy','there','thereafter','thereby','therefore','thereof','thermal','thesaurus','these','thesis','they','thick','thickness','thin','thing','things','think','thinking','thinkpad','thinks','third','thirty','this','thomas','thompson','thomson','thong','thongs','thorough','thoroughly','those','thou','though','thought','thoughts','thousand','thousands','thread','threaded','threads','threat','threatened','threatening','threats','three','threesome','threshold','thriller','throat','through','throughout',  
    'throw','throwing','thrown','throws','thru','thu','thumb','thumbnail','thumbnails','thumbs','thumbzilla','thunder','thursday','thus','thy','ti','ticket','tickets','tide','tie','tied','tier','ties','tiffany','tiger','tigers','tight','til','tile','tiles','till','tim','timber','time','timeline','timely','timer','times','timing','timothy','tin','tiny','tion','tions','tip','tips','tire','tired','tires','tissue','tit','titanium','titans','title','titled','titles','tits','titten','tm','tmp','tn','to','tobacco','tobago','today','todd','toddler','toe','together','toilet','token','tokyo','told','tolerance','toll','tom','tomato','tomatoes','tommy','tomorrow','ton','tone','toner','tones','tongue','tonight','tons','tony','too','took','tool','toolbar','toolbox','toolkit','tools','tooth','top','topic','topics','topless',
    'tops','toronto','torture','toshiba','total','totally','totals','touch','touched','tough','tour','touring','tourism','tourist','tournament','tournaments','tours','toward','towards','tower','towers','town','towns','township','toxic','toy','toyota','toys','tp','tr','trace','track','trackback','trackbacks','tracked','tracker','tracking','tracks','tract','tractor','tracy','trade','trademark','trademarks','trader','trades','trading','tradition','traditional','traditions','traffic','tragedy','trail','trailer','trailers','trails','train','trained','trainer','trainers','training','trains','tramadol','trance','tranny','trans','transaction','transactions','transcript','transcription','transcripts','transexual','transexuales','transfer','transferred','transfers','transform','transformation','transit','transition','translate','translated','translation','translations','translator','transmission','transmit','transmitted','transparency','transparent','transport','transportation','transsexual','trap','trash','trauma','travel','traveler','travelers','traveling',
    'traveller','travelling','travels','travesti','travis','tray','treasure','treasurer','treasures','treasury','treat','treated','treating','treatment','treatments','treaty','tree','trees','trek','trembl','tremendous','trend','trends','treo','tri','trial','trials','triangle','tribal','tribe','tribes','tribunal','tribune','tribute','trick','tricks','tried','tries','trigger','trim','trinidad','trinity','trio','trip','tripadvisor','triple','trips','triumph','trivia','troops','tropical','trouble','troubleshooting','trout','troy','truck','trucks','true','truly','trunk','trust','trusted','trustee','trustees','trusts','truth','try','trying','ts','tsunami','tt','tu','tub','tube','tubes','tucson','tue','tuesday','tuition','tulsa','tumor','tune','tuner','tunes','tuning','tunisia','tunnel','turbo','turkey','turkish','turn','turned','turner','turning','turns','turtle','tutorial','tutorials','tv','tvcom',
    'tvs','twelve','twenty','twice','twiki','twin','twinks','twins','twist','twisted','two','tx','ty','tyler','type','types','typical','typically','typing','u','uc','uganda','ugly','uh','ui','uk','ukraine','ul','ultimate','ultimately','ultra','ultram','um','un','una','unable','unauthorized','unavailable','uncertainty','uncle','und','undefined','under','undergraduate','underground','underlying','understand','understanding','understood','undertake','undertaken','underwear','undo','une','unemployment','unexpected','unfortunately','uni','unified','uniform','union','unions','uniprotkb','unique','unit','united','units','unity','univ','universal','universe','universities','university','unix','unknown','unless','unlike','unlikely','unlimited','unlock','unnecessary','unsigned','unsubscribe','until','untitled','unto','unusual','unwrap','up','upc','upcoming','update','updated','updates','updating','upgrade','upgrades','upgrading','upload','uploaded',
    'upon','upper','ups','upset','upskirt','upskirts','ur','urban','urge','urgent','uri','url','urls','uruguay','urw','us','usa','usage','usb','usc','usd','usda','use','used','useful','user','username','users','uses','usgs','using','usps','usr','usual','usually','ut','utah','utc','utilities','utility','utilization','utilize','utils','uv','uw','uzbekistan','v','va','vacancies','vacation','vacations','vaccine','vacuum','vagina','val','valentine','valid','validation','validity','valium','valley','valuable','valuation','value','valued','values','valve','valves','vampire','van','vancouver','vanilla','var','variable','variables','variance','variation','variations','varied','varies','variety','various','vary','varying','vast','vat','vatican','vault','vb','vbulletin','vc','vcr','ve','vector','vegas','vegetable','vegetables','vegetarian','vegetation','vehicle',
    'vehicles','velocity','velvet','vendor','vendors','venezuela','venice','venture','ventures','venue','venues','ver','verbal','verde','verification','verified','verify','verizon','vermont','vernon','verse','version','versions','versus','vertex','vertical','very','verzeichnis','vessel','vessels','veteran','veterans','veterinary','vg','vhs','vi','via','viagra','vibrator','vibrators','vic','vice','victim','victims','victor','victoria','victorian','victory','vid','video','videos','vids','vienna','vietnam','vietnamese','view','viewed','viewer','viewers','viewing','viewpicture','views','vii','viii','viking','villa','village','villages','villas','vincent','vintage','vinyl','violation','violations','violence','violent','violin','vip','viral','virgin','virginia','virtual','virtually','virtue','virus','viruses','visa','visibility','visible','vision','visit','visited','visiting','visitor','visitors','visits','vista','visual','vital','vitamin',
    'vitamins','vocabulary','vocal','vocals','vocational','voice','voices','void','voip','vol','volkswagen','volleyball','volt','voltage','volume','volumes','voluntary','volunteer','volunteers','volvo','von','vote','voted','voters','votes','voting','voyeur','voyeurweb','voyuer','vp','vpn','vs','vsnet','vt','vulnerability','vulnerable','w','wa','wage','wages','wagner','wagon','wait','waiting','waiver','wake','wal','wales','walk','walked','walker','walking','walks','wall','wallace','wallet','wallpaper','wallpapers','walls','walnut','walt','walter','wan','wang','wanna','want','wanted','wanting','wants','war','warcraft','ward','ware','warehouse','warm','warming','warned','warner','warning','warnings','warrant','warranties','warranty','warren','warrior','warriors','wars','was','wash','washer','washing','washington','waste','watch','watched','watches','watching','water','waterproof','waters',
    'watershed','watson','watt','watts','wav','wave','waves','wax','way','wayne','ways','wb','wc','we','weak','wealth','weapon','weapons','wear','wearing','weather','web','webcam','webcams','webcast','weblog','weblogs','webmaster','webmasters','webpage','webshots','website','websites','webster','wed','wedding','weddings','wednesday','weed','week','weekend','weekends','weekly','weeks','weight','weighted','weights','weird','welcome','welding','welfare','well','wellington','wellness','wells','welsh','wendy','went','were','wesley','west','western','westminster','wet','whale','what','whatever','whats','wheat','wheel','wheels','when','whenever','where','whereas','wherever','whether','which','while','whilst','white','who','whole','wholesale','whom','whore','whose','why','wi','wichita','wicked','wide','widely','wider','widescreen','widespread','width','wife','wifi','wiki',
    'wikipedia','wild','wilderness','wildlife','wiley','will','william','williams','willing','willow','wilson','win','wind','window','windows','winds','windsor','wine','wines','wing','wings','winner','winners','winning','wins','winston','winter','wire','wired','wireless','wires','wiring','wisconsin','wisdom','wise','wish','wishes','wishlist','wit','witch','with','withdrawal','within','without','witness','witnesses','wives','wizard','wm','wma','wn','wolf','woman','women','womens','won','wonder','wonderful','wondering','wood','wooden','woods','wool','worcester','word','wordpress','words','work','worked','worker','workers','workflow','workforce','working','workout','workplace','works','workshop','workshops','workstation','world','worldcat','worlds','worldsex','worldwide','worm','worn','worried','worry','worse','worship','worst','worth','worthy','would','wound','wow','wp','wr','wrap',
    'wrapped','wrapping','wrestling','wright','wrist','write','writer','writers','writes','writing','writings','written','wrong','wrote','ws','wt','wto','wu','wv','ww','www','wx','wy','wyoming','x','xanax','xbox','xerox','xhtml','xi','xl','xml','xnxx','xp','xx','xxx','y','ya','yacht','yahoo','yale','yamaha','yang','yard','yards','yarn','ye','yea','yeah','year','yearly','years','yeast','yellow','yemen','yen','yes','yesterday','yet','yield','yields','yn','yo','yoga','york','yorkshire','you','young','younger','your','yours','yourself','youth','yr','yrs','yu','yugoslavia','yukon','z','za','zambia','zdnet','zealand','zen','zero','zimbabwe','zinc','zip','zoloft','zone','zones','zoning','zoo','zoom','zoophilia','zope','zshops','zu','zum','zus'
]

// -------- js/misc/pathbuilder.js --------

class PathBuilder {

    constructor(naivePath=[], path=[], roomId=undefined, currSum=undefined) {
        this.naivePath = naivePath
        this.path = path

        if (roomId === undefined) {
            this.cachedRoomId = RoomIndicator.generateId(this.path)
        } else {
            this.cachedRoomId = roomId
        }

        if (currSum === undefined) {
            this._currSum = this.cachedRoomId
            if (this.path.length > 0) {
                this._currSum -= 1n
            }
            if (this.path.length > 1) {
                this._currSum -= RoomIndicator.roomsAtDistance(BigInt(this.path.length - 1))
            }
        } else {
            this._currSum = currSum
        }
    }

    getPathId(move, lastmove) {
        if (lastmove === undefined) {
            return move
        } else {
            // will never return 3
            return (move + lastmove) % 4
        }
    }

    get roomId() {
        return this.cachedRoomId
    }

    copy() {
        return new PathBuilder(this.naivePath.slice(), this.path.slice(), this.cachedRoomId, this._currSum)
    }

    addStop(moveId) {
        const lastChangeId = this.naivePath.slice(-1)[0]

        if (moveId + lastChangeId == 3) {
            this.naivePath.pop()
            this.path.pop()
            this._currSum /= 3n
            
            if (this.path.length == 0) {
                this._currSum = 0n
                this.cachedRoomId = 0n
            } else {
                this.cachedRoomId = this._currSum + 1n
            }
            
            if (this.path.length > 1) {
                this.cachedRoomId += RoomIndicator.roomsAtDistance(BigInt(this.path.length - 1))
            }
        } else {
            this.naivePath.push(moveId)
            const newMoveId = this.getPathId(moveId, lastChangeId)
            this.path.push(newMoveId)

            const pathLengthMinus1 = BigInt(this.path.length - 1)
            this._currSum *= 3n
            this._currSum += BigInt(newMoveId)

            this.cachedRoomId = this._currSum + 1n
            if (this.path.length > 1) {
                this.cachedRoomId += RoomIndicator.roomsAtDistance(pathLengthMinus1)
            }
        }
    }

    static naiveToMod(naivePath) {
        const builder = new PathBuilder()
        for (let move of naivePath) {
            builder.addStop(move)
        }
        return builder.path
    }

    static toNaivePath(path) {
        let naivePath = []
        for (let i = 0; i < path.length; i++) {
            const last = naivePath[i - 1]
            if (last === undefined) {
                naivePath.push(path[i])
            } else {
                // 0,0 -> 0   0,1 -> 1   0,2 -> 2
                // 1,0 -> 3   1,1 -> 0   1,2 -> 1
                // 2,0 -> 2   2,1 -> 3   2,2 -> 0
                // 3,0 -> 1   3,1 -> 2   3,2 -> 3
                naivePath.push([
                    [0, 1, 2],
                    [3, 0, 1],
                    [2, 3, 0],
                    [1, 2, 3]
                ][last][path[i]])
            }
        }
        return naivePath
    }

    static compressPath(path) {
        let newPath = null
        for (let j = 0; j < path.length; j++) {
            newPath = []
            for (let i = 0; i < path.length; i++) {
                if (i < path.length - 1 && path[i] + path[i + 1] == 3) {
                    i++
                } else {
                    newPath.push(path[i])
                }
            }
            path = newPath
        }
        return path
    }

}

window.PathBuilder = PathBuilder

// -------- js/misc/crosshair.js --------

class Crosshair {

    get defaultSizePx() {
        return Math.min(window.innerWidth, window.innerHeight) * 0.03
    }

    constructor() {
        this.element = this._initElement()
        this.size = 1
        this._desiredSizePx = this.size * this.defaultSizePx
        this._sizePx = this._desiredSizePx
        this.adaptSpeed = 0.2
        this.updateElement()
    }

    _initElement() {
        const element = document.createElement("div")
        element.style.position = "fixed"
        element.style.zIndex = 49
        element.style.top = "50%"
        element.style.left = "50%"
        element.style.transform = "translate(-50%, -50%)"
        element.style.border = "1px solid gray"
        element.style.borderRadius = "100%"
        document.body.appendChild(element)
        return element
    }

    hide() {
        this.element.style.display = "none"
    }

    show() {
        this.element.style.display = "block"
    }

    updateElement() {
        this.element.style.width = `${this._sizePx}px`
        this.element.style.height = `${this._sizePx}px`
    }

    update() {
        this._desiredSizePx = this.size * this.defaultSizePx
        const sizeDelta = this._desiredSizePx - this._sizePx

        if (Math.floor(Math.abs(sizeDelta)) > 0) {
            this._sizePx += sizeDelta * this.adaptSpeed
            this.updateElement()
        }
    }

}

// -------- js/misc/roomindicator.js --------

class RoomIndicator {

    static element = document.getElementById("room-id")
    static moves = [
        new THREE.Vector2(0, -1),
        new THREE.Vector2(-1, 0),
        new THREE.Vector2(1, 0),
        new THREE.Vector2(0, 1)
    ]

    static roomsAtDistanceCache = new Map()

    static roomsAtDistance(n) {
        if (this.roomsAtDistanceCache.has(n)) {
            return this.roomsAtDistanceCache.get(n)
        }

        let sum = 0n
        let adder = 1n
        for (let i = 0 ; i < n; i++) {
            sum += adder
            adder *= 3n
        }

        const result = sum * 4n
        this.roomsAtDistanceCache.set(n, result)
        return result
    }

    static moveFromPathId(id) {
        return this.moves[id]
    }

    static pathIdFromMove(move) {
        if (move[0] ==  0 && move[1] == -1) return 0
        if (move[0] == -1 && move[1] ==  0) return 1
        if (move[0] ==  1 && move[1] ==  0) return 2
        if (move[0] ==  0 && move[1] ==  1) return 3
    }

    static generateId(path) {
        const pathLength = BigInt(path.length)
        let sum = 0n
        let factor = 1n
        for (let i = 0n; i < pathLength; i++) {
            const coefficient = BigInt(path[pathLength - 1n - i])
            sum += coefficient * factor 
            factor *= 3n
        }

        if (pathLength > 0n) {
            sum += 1n
        }

        if (pathLength > 1n) {
            sum += this.roomsAtDistance(pathLength - 1n)
        }

        return sum
    }

    static async generatePath(roomId) {
        if (roomId == 0n) {
            return []
        } else if (roomId <= 4n) {
            return [parseInt(roomId) - 1]
        } else {
            roomId -= 1n
        }

        const path = []

        let roomsAtShorterPath = null
        let steps = 0n

        ;{
            let sum = 0n
            let adder = 1n
            let prev = 1n
            while (true) {
                prev = roomsAtShorterPath
                sum += adder
                adder *= 3n
                roomsAtShorterPath = sum * 4n
                if (roomsAtShorterPath > roomId) {
                    roomsAtShorterPath = prev
                    break
                }
                steps++

                if (steps % 3000n == 0n) {
                    if (BookGenerator.stopCalculationFlag) {
                        throw new Error("Stopped Calculation")
                    }
                    await new Promise(resolve => setTimeout(resolve, 0))
                }
            }
        }

        roomId -= roomsAtShorterPath

        path.push(parseInt(roomId / (3n ** steps)))

        let addedPath = []
        for (let i = 0; i < steps; i++) {
            var moveId = roomId % 3n
            roomId /= 3n

            addedPath.push(parseInt(moveId))

            if (i % 3000 == 0) {
                if (BookGenerator.stopCalculationFlag) {
                    throw new Error("Stopped Calculation")
                }
                await new Promise(resolve => setTimeout(resolve, 0))
            }
        }

        return path.concat(addedPath.reverse())
    }

    static shortenId(id, length=30) {
        const halfMinus1 = Math.floor(length / 2 - 1)
        if (id.length > length) {
            id = id.slice(0, halfMinus1) + ".." + id.slice(id.length - halfMinus1, id.length)
        }
        return id
    }

    static update(sceneManager) {
        let roomId = sceneManager.roomId
        let stringId = roomId.toString(10)
        this.element.title = this.shortenId(stringId, 200)

        const shortId = this.shortenId(stringId, 20)
        const s = sceneManager.currFloorId.toString()
        const floorSuffix = s.endsWith("1") ? "st" : s.endsWith("2") ? "nd" : "th"
        this.element.innerHTML = `${sceneManager.currFloorId}${floorSuffix} Floor<br>Room#${shortId}`
        return roomId
    }

}

window.RoomIndicator = RoomIndicator

// -------- js/misc/bookgenerator.js --------

class BookGenerator {

    static alphabet = "abcdefghijklmnopqrstuvwxyz ,.\n"
    static originalAlphabet = "abcdefghijklmnopqrstuvwxyz ,.\n"
    static stopCalculationFlag = false

    static numRoomsCacheAlphabetLength = -1
    static numRoomsCache = new Map()

    static invalidateCache() {
        this.numRoomsCache.clear()
    }

    static changeAlphabet(newAlphabet) {
        if (newAlphabet.length == 0) {
            throw new Error("Invalid alphabet")
        }

        if (newAlphabet.toLowerCase().trim() == "10000 english words") {
            newAlphabet = wordlist1000.map(w => w + " ")
        }

        this.alphabet = newAlphabet
        this.invalidateCache()

        if (typeof newAlphabet == "string" && document.getElementById("alphabet-input")) {
            document.getElementById("alphabet-input").value = newAlphabet.replaceAll("\n", "\\n")
        } else if (Array.isArray(newAlphabet)) {
            if (newAlphabet.length <= 16) {
                document.getElementById("alphabet-input").value = JSON.stringify(newAlphabet)
            } else {
                const s = JSON.stringify(newAlphabet)
                document.getElementById("alphabet-input").value = s.slice(0, 25) + "....." + s.slice(-25, s.length)
            }
        }
    }

    static resetAlphabet() {
        this.changeAlphabet(this.originalAlphabet)
    }

    static getMaxBookId(floorId) {
        if (this.numRoomsCacheAlphabetLength == this.alphabet.length && this.numRoomsCache.has(floorId)) {
            return this.numRoomsCache.get(floorId)
        } else {
            if (this.numRoomsCacheAlphabetLength != this.alphabet.length) {
                this.numRoomsCache.clear()
                this.numRoomsCacheAlphabetLength = this.alphabet.length
            }

            // this potentially takes a long time to compute! that's why we're caching
            const numBooks = this.alphabetLength ** floorId
            this.numRoomsCache.set(floorId, numBooks)

            return numBooks
        }
    }

    static roomExists(roomId, floorId) {
        if (floorId < 1) {
            throw new Error("Floor cannot be smaller than 1")
        }

        const bookId = this.bookIdFromLocation(roomId, 0n, 0n, 0n)
        const numBooks = this.getMaxBookId(floorId)
        return bookId <= numBooks
    }

    static getMaxInstanceIdOnShelf(roomId, floorId, shelfId) {
        const delta = this.getMaxBookId(floorId) - this.bookIdFromLocation(roomId, shelfId, 0n, 0n)

        if (delta > 208n) {
            return 208n
        } else if (delta < 0n) {
            return 0n
        } else {
            return delta
        }
    }

    static stopCalculation() {
        this.stopCalculationFlag = true
    }

    static get alphabetLength() {
        return BigInt(this.alphabet.length)
    }

    static generateBook(bookId, length) {
        let bookContent = ""

        for (let i = 0n; i < length; i++) {
            let alphabetIndex = bookId % this.alphabetLength
            bookContent += this.alphabet[alphabetIndex]
            bookId -= alphabetIndex
            bookId /= this.alphabetLength
        }

        return bookContent
    }

    static bookIdFromLocation(roomId, shelfId, rowId, columnId) {
        // 26 books / column
        // 8 columns / shelf >>> 26*8 = 208 books / shelf
        // 8 shelves / room  >>> 26*8*8 = 1664 books / room
        return roomId * 1664n + shelfId * 208n + rowId * 26n + columnId
    }

    static bookFromLocation(roomId, shelfId, rowId, columnId, floorId) {
        if (!this.roomExists(roomId, floorId)) {
            throw new Error(`Room#${roomId} doesn't exist on floor ${floorId}`)
        }

        const bookId = this.bookIdFromLocation(roomId, shelfId, rowId, columnId)
        return this.generateBook(bookId, floorId)
    }

    static async bookIdFromContent(bookContent) {
        const floorId = BigInt(bookContent.length)

        let bookId = 0n
        let factor = 1n
        const factorFactor = this.alphabetLength
        for (let i = 0; i < bookContent.length; i++) {
            const letterIndex = i
            const letter = bookContent[letterIndex]
            const alphabetIndex = this.alphabet.indexOf(letter)
            if (alphabetIndex == -1) {
                throw new Error(`Unknown letter "${letter}" at index ${letterIndex}`)
            }

            bookId += factor * BigInt(alphabetIndex)
            factor *= factorFactor

            if (i % 1000 == 0) {
                await new Promise(resolve => setTimeout(resolve, 0))
                if (this.stopCalculationFlag) {
                    throw new Error("Stopped Calculation")
                }
            }
        }
        
        return {bookId, floorId}
    }

    static async searchBookByOnlyId(bookId, {generatePaths = true}={}) {
        let floorId = 1n

        // use copy of variable in case js ever decides
        // to pass BigInt's by reference and break everything
        let a = bookId
        const divisor = this.alphabetLength

        while (a > 1n) {
            a /= divisor
            floorId++

            if (floorId % 1000n == 0n) {
                await new Promise(resolve => setTimeout(resolve, 0))
            }
        }

        return this.searchBookById(bookId, floorId, {generatePaths})
    }

    static async searchBookById(bookId, floorId, {generatePaths = true}={}) {
        this.stopCalculationFlag = false
        const roomId = bookId / 1664n
        let remainder = bookId % 1664n

        const shelfId = remainder / 208n
        remainder = remainder % 208n

        const rowId = remainder / 26n
        remainder = remainder % 26n

        const columnId = remainder

        if (generatePaths) {
            const path = await RoomIndicator.generatePath(roomId)
            const naivePath = PathBuilder.toNaivePath(path)
            return {bookId, floorId, roomId, shelfId, rowId, columnId, path, naivePath}
        }

        return {bookId, floorId, roomId, shelfId, rowId, columnId}
    }

    static async searchBook(bookContent, {generatePaths = true}={}) {
        this.stopCalculationFlag = false
        const {bookId, floorId} = await this.bookIdFromContent(bookContent)
        return await this.searchBookById(bookId, floorId, {generatePaths})
    }

}

window.BookGenerator = BookGenerator

// -------- js/misc/comments.js --------

class Comments {

    static numCommentsOutput = document.getElementById("num-comments-output")
    static loadingCommentsDisplay = document.getElementById("loading-comments-display")
    static commentsContainer = document.getElementById("comments-container")

    static commentAuthorInput = document.getElementById("comment-author-input")
    static commentContentInput = document.getElementById("comment-content-input")
    static commentSubmitButton = document.getElementById("comment-submit-button")
    static commentErrorOutput = document.getElementById("comment-error-output")

    static currHash = null
    static currBookId = null

    static async getBookIdHash(bookId) {
        let hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bookId.toString()))
        let hashArray = Array.from(new Uint8Array(hash))
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    }

    static async getComments(bookId) {
        const hash = await this.getBookIdHash(bookId)
        this.currHash = hash

        const rawResponse = await fetch(`api/get_comments.php?bookid_hash=${hash}`)
        const response = await rawResponse.json()
        if (response.ok) {
            return response.comments
        } else {
            throw new Error(response.error)
        }
    }

    static makeCommentElement(commentData) {
        const commentElement = document.createElement("div")
        const profilePicture = document.createElement("div")
        const author = document.createElement("div")
        const content = document.createElement("div")

        commentElement.classList.add("comment")
        profilePicture.classList.add("profile-picture")
        author.classList.add("author")
        content.classList.add("content")

        author.textContent = `"${commentData.author}" commented (${commentData.create_time}):`
        content.textContent = commentData.content

        commentElement.appendChild(profilePicture)
        commentElement.appendChild(author)
        commentElement.appendChild(content)

        return commentElement
    }

    static setLoading(newState) {
        if (newState == true) {
            this.loadingCommentsDisplay.textContent = "Loading Comments..."
            this.loadingCommentsDisplay.style.display = "block"
            this.numCommentsOutput.textContent = "?"
        } else if (newState == false) {
            this.loadingCommentsDisplay.style.display = "none"
        }
    }

    static async reload() {
        if (this.currBookId != null) {
            await this.load(this.currBookId)
        }
    }

    static async load(bookId) {
        this.currBookId = bookId
        this.commentErrorOutput.textContent = ""

        // clear previous comment input
        this.commentAuthorInput.value = ""
        this.commentContentInput.value = ""
        
        try {
            this.commentsContainer.innerHTML = ""
            this.setLoading(true)
    
            const comments = await this.getComments(bookId)
            this.numCommentsOutput.textContent = comments.length
    
            for (let commentData of comments) {
                const commentElement = this.makeCommentElement(commentData)
                this.commentsContainer.appendChild(commentElement)
            }
    
            this.setLoading(false)
        } catch (e) {
            this.loadingCommentsDisplay.textContent = e.message
            this.loadingCommentsDisplay.style.display = "block"
            this.commentsContainer.innerHTML = ""
        }
    }

    static replaceWithAlphabet(text) {
        let newText = text.toLowerCase().replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue")
            .replaceAll("!", ".").replaceAll("?", ".").replaceAll("ß", "ss")
        return newText.split("").filter(c => BookGenerator.originalAlphabet.includes(c)).join("")
    }

    static init() {
        const error = msg => {
            this.commentErrorOutput.textContent = msg == "noshow" ? "" : msg

            if (msg) {
                this.commentSubmitButton.disabled = true
            } else {
                this.commentSubmitButton.disabled = false
            }

            return {author: null, content: null}
        }

        const checkInputs = () => {
            if (this.currHash == null) {
                return error("noshow")
            }

            let author = this.commentAuthorInput.value
            let content = this.commentContentInput.value

            content = this.replaceWithAlphabet(content).slice(0, 512)
            this.commentContentInput.value = content

            author = this.replaceWithAlphabet(author).slice(0, 64)
            this.commentAuthorInput.value = author

            if (author.length == 0) {
                return error("noshow")
            }

            if (content.length == 0) {
                return error("noshow")
            }

            error("")
            return {author, content}
        }

        this.commentAuthorInput.oninput = checkInputs
        this.commentContentInput.oninput = checkInputs

        this.commentSubmitButton.onclick = async () => {
            const {author, content} = checkInputs()
            if (author == null) return

            const formData = new FormData()
            formData.append("author", author)
            formData.append("content", content)
            formData.append("bookid_hash", this.currHash)

            if (BookViewer.isOpen && BookViewer.contentCache) {
                formData.append("book_content", BookViewer.contentCache)
            }
        
            const rawResponse = await fetch("api/write_comment.php", {
                method: "POST",
                body: formData
            })

            const response = await rawResponse.json()
            
            if (response.ok) {
                // this.commentErrorOutput.textContent = "Comment sent. After an admin has confirmed it, it will appear here. Thank you!"
                this.commentErrorOutput.textContent = "Comment sent. It should appear shortly!"
                setTimeout(() => {
                    this.commentErrorOutput.textContent = ""
                    this.reload()
                }, 1000)

                this.commentAuthorInput.value = ""
                this.commentContentInput.value = ""
            } else {
                this.commentErrorOutput.textContent = response.error
            }
        }
    }

}

// -------- js/misc/bookviewer.js --------

class BookViewer {

    static contentStartSlice = document.getElementById("book-content-start-slice")
    static contentEndSlice = document.getElementById("book-content-end-slice")
    static contentMarkSlice = document.getElementById("book-content-mark-slice")

    static markIndex = null

    static idElement = document.getElementById("book-id")
    static container = document.getElementById("book-container")
    static book = document.getElementById("book")

    static _onNextCloseListeners = []

    static onNextClose(f) {
        this._onNextCloseListeners.push(f)
    }

    static isOpen = false
    static isAnimating = false

    static contentCache = null
    static bookIdCache = null

    static updateContent() {
        if (this.markIndex == null) {
            this.contentStartSlice.textContent = this.contentCache
            this.contentMarkSlice.textContent = ""
            this.contentEndSlice.textContent = ""
        } else {
            this.contentStartSlice.textContent = this.contentCache.slice(0, this.markIndex)
            this.contentMarkSlice.textContent = this.contentCache[this.markIndex]
            this.contentEndSlice.textContent = this.contentCache.slice(this.markIndex + 1, this.contentCache.length)
        }
    }

    static openBook(bookId) {
        this.idElement.textContent = `Book#${bookId}\non Floor#${sceneManager.currFloorId}`

        const bookContent = BookGenerator.generateBook(bookId, sceneManager.currFloorId)
        
        this.contentCache = bookContent
        this.bookIdCache = bookId
        this.updateContent()

        this.open()
        
        Comments.load(bookId)
    }

    static open() {
        if (this.isOpen || this.isAnimating) {
            return
        }

        this.markIndex = null

        this.book.animate([
            {opacity: 0, transform: "scale(0)"},
            {opacity: 1, transform: "scale(1)"},
        ], {
            duration: 500,
            easing: "ease-in"
        })

        this.container.animate([
            {opacity: 0},
            {opacity: 1},
        ], {
            duration: 500,
            easing: "ease-in"
        })

        this.isAnimating = true
        sceneManager.blockInputs = true
        setTimeout(() => this.isAnimating = false, 500)

        this.container.style.display = "flex"
        this.isOpen = true
        sceneManager.exitControls()
    }

    static async close(manualClose=true) {
        if (!this.isOpen || this.isAnimating) {
            return
        }

        MusicPlayer.reset()

        if (manualClose) {
            stopRandomCarousel()
        }

        this.isOpen = false

        for (let f of this._onNextCloseListeners) {
            f()
        }

        this._onNextCloseListeners = []

        this.book.animate([
            {opacity: 1, transform: "scale(1)"},
            {opacity: 0, transform: "scale(0)"}
        ], {
            duration: 500,
            easing: "ease-out"
        })

        this.container.animate([
            {opacity: 1},
            {opacity: 0},
        ], {
            duration: 500,
            easing: "ease-out"   
        })

        this.isAnimating = true
        sceneManager.blockInputs = false

        await new Promise(resolve => setTimeout(resolve, 500))
        this.isAnimating = false

        if (this.isOpen) {
            return
        }

        this.container.style.display = "none"
    }

    static init() {
        sceneManager.canvas.addEventListener("click", event => {
            this.close()
        })

        document.addEventListener("keydown", event => {
            if (event.key == "Escape") {
                this.close()
            }
        })

        document.getElementById("download-book").onclick = () => {
            if (!this.contentCache || !this.isOpen) {
                return
            }

            downloadBook(this.contentCache, this.bookIdCache, sceneManager.currFloorId)
        }

        document.getElementById("share-book").onclick = () => {
            if (!this.isOpen || this.bookIdCache == null) {
                return
            }

            const url = ShareLink.generateUrl(this.bookIdCache, sceneManager.currFloorId)
            if (!url) {
                alert("BookId is too large to share. Sorry!")
            } else {
                try {
                    if (navigator.share) {
                        navigator.share({
                            url,
                            title: "Book in the Library of Léon"
                        })
                    } else {
                        throw new Error("User Agent does not support sharing")
                    }
                } catch (e) {
                    console.error(e)
                    window.open(url, '_blank')
                }
            }
        }
        
        const playBookButton = document.getElementById("play-book")
        playBookButton.onclick = async () => {
            if (!this.contentCache || !this.isOpen) {
                return
            }

            if (MusicPlayer.isRunning) {
                MusicPlayer.reset()
                this.markIndex = null
                this.updateContent()
            } else {
                MusicPlayer.reset()
                await MusicPlayer.playContent(this.contentCache, {
                    callback: index => {
                        this.markIndex = index
                        this.updateContent()
                    }
                })
                this.markIndex = null
                this.updateContent()
            }
        }
    }

}

window.BookViewer = BookViewer

// -------- js/misc/menu.js --------

class Menu {

    static isOpen = true
    static container = document.getElementById("main-menu-container")
    static transitionMs = 500 // needs to match css .main-menu-container transition period

    static get isClosed() {
        return !this.isOpen
    }

    static open() {
        if (HorrorManager.active) {
            HorrorManager.pause()
        }

        if (this.isOpen || BookViewer.isAnimating || BookViewer.isOpen || HorrorManager.active) {
            return
        }

        this.container.style.display = "flex"
        sceneManager.blockInputs = true
        updateFloorChoice()

        // dirty hack; container style display needs to be processed
        // before transition animations may be initiated. timeout
        // will (hopefully) let renderer process in between
        setTimeout(() => {
            this.container.style.opacity = 1
        }, 10)

        this.isOpen = true
    }

    static close() {
        if (this.isClosed) {
            return
        }

        this.container.style.opacity = 0
        sceneManager.blockInputs = false
        this.isOpen = false

        setTimeout(() => {
            this.container.style.display = "none"
        }, this.transitionMs)
    }

    static init() {
        sceneManager.canvas.addEventListener("click", event => {
            this.close()
        })
    }

}

window.Menu = Menu

// -------- js/misc/search.js --------

function initSearch() {

    function filterText(value) {
        if (searchMode == "content") {
            const lowerCaseAlphabet = "abcdefghijklmnopqrstuvwxyz"
            const upperCaseAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            for (let i = 0; i < 26; i++) {
                if (!BookGenerator.alphabet.includes(upperCaseAlphabet[i])) {
                    value = value.replaceAll(upperCaseAlphabet[i], lowerCaseAlphabet[i])
                }
            }

            if (!BookGenerator.alphabet.includes("ä")) value = value.replaceAll("ä", "ae")
            if (!BookGenerator.alphabet.includes("ö")) value = value.replaceAll("ö", "oe")
            if (!BookGenerator.alphabet.includes("ü")) value = value.replaceAll("ü", "ue")
            if (!BookGenerator.alphabet.includes("ß")) value = value.replaceAll("ß", "ss")
            if (!BookGenerator.alphabet.includes("!")) value = value.replaceAll("!", ".")
            if (!BookGenerator.alphabet.includes("?")) value = value.replaceAll("?", ".")

            return value.split("").filter(c => BookGenerator.alphabet.includes(c)).join("")
        } else if (searchMode == "bookid") {
            return value.split("").filter(c => "0123456789".includes(c)).join("")
        } else {
            throw new Error(`Searchmode "${searchMode}" is not implemented.`)
        }
    }

    async function upgradeSearchResult() {
        if (!searchResult) {
            return false
        }

        if (searchResult.path != undefined) {
            return true
        }

        try {
            calculatingShow.style.display = "block"
            await new Promise(resolve => setTimeout(resolve, 50))
            searchResult = await BookGenerator.searchBookById(searchResult.bookId, searchResult.floorId)
            calculatingShow.style.display = "none"
        } catch (e) {
            calculatingShow.style.display = "none"
            return false
        }

        return true
    }

    async function jumpToFloor() {
        if (!await upgradeSearchResult()) {
            return
        }

        Menu.close()
        sceneManager.stopSearch()

        if (sceneManager.currFloorId == searchResult.floorId) {
            await sceneManager.changeFloor(searchResult.floorId + 1n)
        }

        await sceneManager.changeFloor(searchResult.floorId)
        sceneManager.startSearch(searchResult)
    }

    async function teleportToRoom() {
        if (!await upgradeSearchResult()) {
            return
        }

        sceneManager.startSearch(searchResult)
        sceneManager.teleportToSearchEnd()
        Menu.close()
    }

    window.jumpToFloor = jumpToFloor
    window.teleportToRoom = teleportToRoom
    
    let timeout = null
    let searchTimeout = null

    let searchResult = null
    
    const searchElement = document.getElementById("search-input")
    const searchContainer = document.getElementById("search-container")
    const resultContainer = document.getElementById("results-container")
    const calculatingShow = document.getElementById("calculating-show")
    const modeSelector = document.getElementById("mode-selector")
    const modeButtons = modeSelector.querySelectorAll("button")

    let searchMode = "content"

    function chooseMode(mode) {
        for (let button of modeButtons) {
            const selected = button.dataset.mode == mode
            button.dataset.selected = selected
            if (selected) {
                searchElement.placeholder = button.dataset.description
                searchMode = button.dataset.mode
            }
        }
        searchElement.oninput()
    }

    for (let modeButton of modeButtons) {
        modeButton.onclick = () => chooseMode(modeButton.dataset.mode)
    }
    
    async function search(query) {
        if (query.length == 0) {
            resultContainer.style.display = "none"
            return
        }
        
        calculatingShow.style.display = "block"
        await new Promise(resolve => setTimeout(resolve, 50))

        let result = null
    
        if (searchMode == "content") {
            result = await BookGenerator.searchBook(query, {generatePaths: false})
        } else if (searchMode == "bookid") {
            const bookId = BigInt(query)
            result = await BookGenerator.searchBookByOnlyId(bookId, {generatePaths: false})
        } else {
            throw new Error(`Searchmode "${searchMode}" is not implemented.`)
        }

        resultContainer.style.display = "grid"

        searchResult = result
    
        const bookId = result.bookId.toString()
        const roomId = result.roomId.toString()
    
        document.getElementById("bookid-out").textContent = RoomIndicator.shortenId(bookId, 20)
        document.getElementById("bookid-out").title = RoomIndicator.shortenId(bookId, 200)
    
        document.getElementById("roomid-out").textContent = RoomIndicator.shortenId(roomId, 20)
        document.getElementById("roomid-out").title = RoomIndicator.shortenId(roomId, 200)
    
        document.getElementById("floorid-out").textContent = result.floorId.toString()
        document.getElementById("floorid-out").title = result.floorId.toString()
    
        document.getElementById("shelfid-out").textContent = result.shelfId.toString()
        document.getElementById("shelfid-out").title = result.shelfId.toString()
    
        document.getElementById("rowid-out").textContent = result.rowId.toString()
        document.getElementById("rowid-out").title = result.rowId.toString()
    
        document.getElementById("columnid-out").textContent = result.columnId.toString()
        document.getElementById("columnid-out").title = result.columnId.toString()
    
        searchContainer.scrollIntoView({
            behavior: "smooth"
        })
        calculatingShow.style.display = "none"
    }
    
    searchElement.oninput = () => {
        let value = searchElement.value
        let cleaned = filterText(value)
        const lines = value.split("\n").length
        searchElement.rows = Math.min(Math.max(lines, 3), 10)
    
        if (timeout) {
            clearTimeout(timeout)
        }
    
        if (searchTimeout) {
            clearTimeout(searchTimeout)
        }
    
        timeout = setTimeout(() => {
            searchElement.value = cleaned
        }, 100)
    
        searchTimeout = setTimeout(async () => {
            try {
                await search(cleaned)
            } catch {
                calculatingShow.style.display = "none"
                resultContainer.style.display = "none"
            }
        }, 1000)
    }
    
    calculatingShow.onclick = () => {
        BookGenerator.stopCalculation()
    }

    function scrollToSearch() {
        searchElement.scrollIntoView({
            behavior: "smooth"
        })

        searchElement.animate([
            {outline: "0px solid yellow"},
            {outline: "9px solid yellow"},
            {outline: "0px solid yellow"},
        ], {
            duration: 1500,
            easing: "ease-in"
        })
    }

    window.scrollToSearch = scrollToSearch
    
    window.searchStarterBook = function() {
        const bookId = "1585735209919233288729956182793682303396300295191941117219256247982759740045543778086538805678333522684227270240256675377434716418243760248053035239535300035239480177009263728543029996772515469141397618457150928864491882002038925495197923231867515541335889936710551820034978673148606384806981851363163973480237991815952585433152440843958412944089331831183070145239583529924552079718986570066996407425587881255713156775967168427514655613520843113636884994594030520026850192184258833723823721729090882894351388157910303979037225068635380928310575292973073147619668420245879061570061255387868041594872303801953358733654621221086460870814721932197681390838626737279915826560698699820034633838709940438339819315845150825912245721540774072351811284934949725539871873726796977194647391981197115706570350345622709608125228949800636437208233751752465411285036688531102860426411413976964594474136983379899908787121357324774267831313988195954170108521627639739004042"
        chooseMode("bookid")
        searchElement.value = bookId
        searchElement.oninput()
    }

    function randomBigInt(max) {
        const maxAsString = max.toString()
        let randomString = ""
        for (let i = 0; i < maxAsString.length; i++) {
            let randomDigit = Math.floor(Math.random() * 10)
            randomString = randomDigit.toString() + randomString
    
            if (i == maxAsString.length - 1) {
                if (BigInt(randomString) >= max) {
                    randomString = randomString.slice(1)
                    i--
                }
            }
        }
        return BigInt(randomString)
    }

    window.openRandomBook = async function() {
        const maxBookId = BookGenerator.getMaxBookId(sceneManager.currFloorId)
        const bookId = randomBigInt(maxBookId)
        Menu.close()
        BookViewer.openBook(bookId)
    }

    const alphabetInput = document.getElementById("alphabet-input")
    alphabetInput.value = BookGenerator.alphabet.replaceAll("\n", "\\n")
    const originalValue = BookGenerator.alphabet
    alphabetInput.oninput = () => {
        const newAlphabet = alphabetInput.value.replaceAll("\\n", "\n")
        if (newAlphabet.length == 0) {
            alphabetInput.value = originalValue
            return
        }

        BookGenerator.changeAlphabet(newAlphabet)
        sceneManager.currFloor.updateRooms()
    }
}

// -------- js/misc/floorchoice.js --------

{
    const floorChoiceContainer = document.getElementById("floor-choice")
    const floorChoiceOutput = floorChoiceContainer.querySelector("input")
    const incrementButtons = floorChoiceContainer.querySelectorAll("button")
    let isAnimating = false

    function animationMsFromInc(inc) {
        inc = Math.abs(parseInt(inc))
        return Math.exp(-0.004 * (inc - 100)) * -500 + 1000
    }

    async function incremenetFloor(inc) {
        let newFloor = sceneManager.currFloorId + BigInt(inc)
        if (newFloor < 1n) {
            newFloor = 1n
        }

        
        isAnimating = true
        const animationMs = animationMsFromInc(sceneManager.currFloorId - newFloor)
        await sceneManager.changeFloor(newFloor, {animationDuration: animationMs})
        window.updateFloorChoice()
        isAnimating = false
    }

    for (let button of incrementButtons) {
        button.onclick = () => {
            if (isAnimating) {
                return
            }

            incremenetFloor(button.dataset.increment)
        }
    }

    window.updateFloorChoice = () => {
        floorChoiceOutput.value = `Current Floor: ${sceneManager.currFloorId}`
    }
}

// -------- js/misc/random-carousel.js --------

{
    function randomFloor() {
        const x = Math.random()
        const a = 1.95
        const b = (1 - a) / a
        const c = 78.6
        const d = 1000
        return BigInt(Math.floor(Math.tan(Math.PI / 2 * a * (x + b)) * c + d))
    }

    let intervalId = null

    window.startRandomCarousel = () => {
        const f = async () => {
            BookViewer.close(false)
            Menu.close()
            await sceneManager.changeFloor(randomFloor(), {animationDuration: 1000})
            openRandomBook()
        }

        intervalId = setInterval(f, 10000)
        f()
    }

    window.stopRandomCarousel = () => {
        if (intervalId != null) {
            clearInterval(intervalId)
            intervalId = null
        }
    }
}

// -------- js/misc/downloadbook.js --------

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

// -------- js/misc/musicplayer.js --------

class MusicPlayer {

    static osc = null
    static context = null
    static gain = null

    static hasInitted = false
    static processId = 0

    static isRunning = false

    static init() {
        if (this.hasInitted) {
            return
        }

        this.context = new AudioContext()
        this.osc = this.context.createOscillator()
        this.gain = this.context.createGain()

        this.osc.connect(this.gain)
        this.gain.connect(this.context.destination)

        this.hasInitted = true
    }

    static stop() {
        if (this.hasInitted) {
            this.osc.stop()
            this.isRunning = false
        }
    }

    static reset() {
        this.stop()
        this.hasInitted = false
        this.processId++
    }

    static async playContent(content, {
        intervalMs = "random",
        callback = null
    }={}) {
        function frequencyFromNoteOffset(n) {
            return 220.0 * 2 ** (n / 12)
        }

        const frequencies = []
        
        for (let letter of content) {
            if (!BookGenerator.alphabet.includes(letter)) {
                return
            }
            
            const indexInAlphabet = BookGenerator.alphabet.indexOf(letter)
            
            if (letter == " ") {
                frequencies.push(0)
            } else {
                frequencies.push(frequencyFromNoteOffset(indexInAlphabet))
            }
        }

        await this.playFrequencies(frequencies, {intervalMs, callback})
    }

    static async playFrequencies(frequencies, {
        intervalMs = "random",
        callback = null,
        rampEndValue = 0.1,
        noteMs = undefined,
        removeClicking = false
    }={}) {
        if (this.isRunning) {
            console.error("Warning: MusicPlayer already running")
            this.reset()
        }

        if (intervalMs == "random") {
            intervalMs = Math.floor(Math.random() * 400 + 100)
        }

        noteMs ??= intervalMs

        this.init()
        this.processId++
        let currProcessId = this.processId

        if (!window.AudioContext) {
            return
        }

        const sleep = ms => new Promise(r => setTimeout(r, ms))
        
        this.osc.start()
        this.isRunning = true
        
        for (let i = 0; i < frequencies.length; i++) {
            const freq = frequencies[i]

            if (callback) {
                callback(i, freq)
            }
            
            this.osc.frequency.value = freq
            
            if (freq != 0) {
                if (removeClicking) {
                    this.gain.gain.exponentialRampToValueAtTime(1, this.context.currentTime + 0.01)
                    this.gain.gain.exponentialRampToValueAtTime(rampEndValue, this.context.currentTime + noteMs / 1000 + 0.01)
                } else {
                    this.gain.gain.setValueAtTime(1, this.context.currentTime ) 
                    this.gain.gain.exponentialRampToValueAtTime(rampEndValue, this.context.currentTime + noteMs / 1000)
                }
            } else {
                this.gain.gain.exponentialRampToValueAtTime(0.000001, this.context.currentTime + noteMs / 1000)
            }
            
            await sleep(intervalMs)

            if (this.processId != currProcessId) {
                return
            }
        }

        if (removeClicking) {
            this.gain.gain.exponentialRampToValueAtTime(0.000001, this.context.currentTime + 0.015)
            await sleep(200)
        }
        
        this.reset()
    }

}

window.MusicPlayer = MusicPlayer

// -------- js/misc/sharelink.js --------

class ShareLink {

    // a-z, A-Z and 0-9
    static encodeAlphabet = "B6r9uWS8mYbIoXOh4EHUsGLnxkjZi05lCA2Dftzya7TRvFgKNdw1VeJqc3PpMQ"
    static maxUrlLength = 1000

    static generateUrl(bookId, floorId) {
        let baseUrl = window.location.href.split("?")[0]
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/"
        }

        const url = `${baseUrl}?b=${this.encodeBook(bookId, floorId)}`

        if (url.length > this.maxUrlLength) {
            return false
        } else {
            return url
        }
    }

    static encodeNum(n) {
        if (n == 0n) {
            return this.encodeAlphabet[0]
        }

        let outputString = ""
        const alphabetLength = BigInt(this.encodeAlphabet.length)

        while (n > 0n) {
            const index = n % alphabetLength
            n /= alphabetLength
            outputString = this.encodeAlphabet[index] + outputString
        }

        return outputString
    }

    static decodeNum(encodedString) {
        if (encodedString.length == 0) {
            throw new Error("Invalid Encoded String (Empty)")
        }
 
        let sum = 0n
        let factor = 1n
        const alphabetLength = BigInt(this.encodeAlphabet.length)

        for (let i = 0; i < encodedString.length; i++) {
            const char = encodedString[encodedString.length - 1 - i]
            const index = this.encodeAlphabet.indexOf(char)

            if (index == -1) {
                throw new Error(`Invalid Encoded String (Unknown Character "${char}")`)
            }

            sum += BigInt(index) * factor
            factor *= alphabetLength
        }

        return sum
    }

    static encodeBook(bookId, floorId) {
        return `${this.encodeNum(bookId)}-${this.encodeNum(floorId)}`
    }

    static decodeBook(encodedString) {
        const parts = encodedString.split("-")
        if (parts.length != 2) {
            throw new Error(`Invalid Encoded String (Invalid Number of Parts: ${parts.length})`)
        }

        const [bookId, floorId] = parts.map(e => this.decodeNum(e))
        return {bookId, floorId}
    }

}

window.ShareLink = ShareLink

// -------- js/misc/loadingoverlay.js --------

class LoadingOverlay {

    static container = document.getElementById("loading-overlay")

    static show() {
        this.container.animate([
            {transform: "translateY(-100%)"},
            {transform: "translateY(0px)"}
        ], {
            duration: 500,
            easing: "ease-in-out",
            fill: "forwards"
        })
    }

    static hide() {
        this.container.animate([
            {transform: "translateY(0px)"},
            {transform: "translateY(-100%)"}
        ], {
            duration: 500,
            easing: "ease-in-out",
            fill: "forwards"
        })
    }

}

window.LoadingOverlay = LoadingOverlay

// -------- js/horror/horrormanager.js --------

class HorrorManager {

    static active = false
    static colorMode = "normal"
    static gameStartTime = null

    static heartbeat = null

    static paused = false
    static score = null

    static updateColors() {
        if (this.active && this.colorMode == "normal") {
            sceneManager.canvas.animate([
                {filter: "invert(0%)"},
                {filter: "invert(100%)"}
            ], {duration: 500, fill: "forwards"})
            this.colorMode = "inverted"
        } else if (!this.active && this.colorMode == "inverted") {
            sceneManager.canvas.animate([
                {filter: "invert(100%)"},
                {filter: "invert(0%)"}
            ], {duration: 500, fill: "forwards"})
            this.colorMode = "normal"
        }
    }

    static async soundLoop() {
        HorrorSounds.playHeartbeat(2)
    }

    static async start() {
        if (this.active) {
            return
        }

        this.paused = false
        
        BookGenerator.resetAlphabet()
        const truth = "you made it"
        const searchInfo = await BookGenerator.searchBook(truth)
        sceneManager.teleportToMiddle()
        await sceneManager.changeFloor(searchInfo.floorId)
        sceneManager.startSearch(searchInfo)

        HorrorMenu.close()
        await Slenderman.spawn()
        Slenderman.teleport(true)

        this.active = true
        this.updateColors()
        this.gameStartTime = Date.now()

        Menu.close()
        BookViewer.close()

        this.heartbeat = new HeartBeat()
    }

    static async win() {
        const score = Math.floor(this.gameTime / 1000)
        this.paused = true
        sceneManager.keyboardMouseControls._removePointerLock()
        HorrorManager.stop()

        this.score = score
        HorrorMenu.updateScoreOutput(this.score)

        await new Promise(resolve => setTimeout(resolve, 100))
        HorrorMenu.open("won")
    }

    static async turnCameraToSlenderman({
        animationDuration = 1000,
        seeFaceDuration = 1000
    }={}) {
        const facePos = new THREE.Vector3().copy(Slenderman.position).setY(2.1)

        const temp = new THREE.Euler().copy(sceneManager.camera.rotation)
        sceneManager.camera.lookAt(facePos)
        const goalQuaternion = new THREE.Quaternion().setFromEuler(sceneManager.camera.rotation)
        sceneManager.camera.rotation.copy(temp)

        const originalQuaternion = new THREE.Quaternion().setFromEuler(sceneManager.camera.rotation)
        const currQuaternion = new THREE.Quaternion()

        return new Promise(resolve => {
            sceneManager.blockInputs = true
            
            animationManager.startAnimation(new CustomAnimation({
                duration: animationDuration,
                easing: Easing.easeInOut,
                updateFunc: (t) => {
                    currQuaternion.slerpQuaternions(originalQuaternion, goalQuaternion, t)
                    sceneManager.camera.rotation.setFromQuaternion(currQuaternion)
                },
                endFunc: () => {
                    setTimeout(() => {
                        sceneManager.blockInputs = false
                        resolve()
                    }, seeFaceDuration)
                }
            }))
        })
    }

    static async lose() {
        this.score = 0
        this.paused = true

        MusicPlayer.playFrequencies([2000], {intervalMs: 1000})
        await this.turnCameraToSlenderman()

        // TODO: lose animation
        sceneManager.keyboardMouseControls._removePointerLock()

        await new Promise(resolve => setTimeout(resolve, 100))
        HorrorManager.stop()
        HorrorMenu.open("caught")
    }

    static async stop() {
        HorrorMenu.close()

        if (!this.active) {
            return
        }

        this.active = false
        this.updateColors()
        Slenderman.hide()
        this.score = null

        if (this.heartbeat) {
            this.heartbeat.stop()
        }

        sceneManager.stopSearch()
    }

    static get gameTime() {
        if (this.gameStartTime && this.active) {
            return Date.now() - this.gameStartTime
        } else {
            return null
        }
    }

    static updateHeartbeat() {
        if (this.gameTime > 1500 && !this.heartbeat.hasStarted) {
            this.heartbeat.start()
        }

        const x = Math.max(Slenderman.calcDistanceToPlayer(), 1)
        this.heartbeat.beatFrequency = Math.max(Math.exp(-0.1 * (x - 30)), 1)

        if (Slenderman.visible) {
            this.heartbeat.soundFrequency = 300
        } else {
            this.heartbeat.soundFrequency = 400
        }
    }

    static update() {
        if (!this.active || this.paused) {
            return
        }

        if (this.gameTime > 3000) {
            Slenderman.move()
        } else {
            Slenderman.teleport(true)
        }

        this.updateHeartbeat()
    }

    static pause() {
        this.paused = true
        HorrorMenu.open("ingame")
    }

    static continue() {
        this.paused = false
        HorrorMenu.close()
    }

}

window.HorrorManager = HorrorManager

// -------- js/horror/heartbeat.js --------

class HeartBeat {

    constructor() {
        this.context = new AudioContext()
        this.osc = this.context.createOscillator()
        this.gain = this.context.createGain()

        this.osc.connect(this.gain)
        this.gain.connect(this.context.destination)

        this.running = false
        this.calledStart = false

        this.beatFrequency = 1
        this.soundFrequency = 400
    }

    get hasStarted() {
        return this.calledStart
    }

    async playHeartBeat() {
        if (HorrorManager.paused) {
            return
        }
        
        this.osc.frequency.value = this.soundFrequency

        this.gain.gain.setValueAtTime(1, this.context.currentTime)
        this.gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1 / (this.beatFrequency + 1))
    }

    async loop() {
        while (this.running) {
            this.playHeartBeat()
            await new Promise(resolve => setTimeout(resolve, 1000 / this.beatFrequency))
        }
    }

    start() {
        if (this.calledStart) {
            return
        }
        this.calledStart = true

        this.running = true
        this.gain.gain.setValueAtTime(0, this.context.currentTime)
        this.osc.start()
        this.osc.frequency.value = this.soundFrequency
        this.loop()
    }

    stop() {
        this.osc.stop()
        this.running = false
    }

}

window.HeartBeat = HeartBeat

// -------- js/horror/slenderman.js --------

class Slenderman {

    static invertedImgPath = "assets/images/scary-man_inverted.png"

    static mesh = null
    static hasInitted = false
    static visible = false

    static goalX = null
    static goalZ = null

    static moveSpeed = 0.15
    static minGoalDistance = 0.5
    static minPlayerDistance = 1
    static currMinDistance = null

    static teleportMinInterval = 3000
    static lastTeleportTime = null

    static frozenUpdateCount = 0

    static get timeSinceLastTeleport() {
        if (this.lastTeleportTime == null) {
            return Infinity
        }

        return Date.now() - this.lastTeleportTime
    }

    static async makeObject({
        height = 2.5,
    }={}) {
        const img = new Image()
        
        await new Promise(resolve => {
            img.onload = resolve
            img.src = this.invertedImgPath
        })

        const canvas = document.createElement("canvas")
        canvas.height = height * 300
        canvas.width = canvas.height * (img.naturalWidth / img.naturalHeight)
        const context = canvas.getContext("2d")
        
        context.drawImage(img, 0, 0, canvas.width, canvas.height)

        const geometry = new THREE.PlaneGeometry(height * (canvas.width / canvas.height), height)

        const material = new THREE.MeshLambertMaterial({map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide, transparent: true})
        const plane = new THREE.Mesh(geometry, material)
        plane.position.set(1, height / 2, 1)

        sceneManager.scene.add(plane)

        return plane
    }

    static get inSameRoomAsPlayer() {
        return Math.abs(this.position.x) < 7 && Math.abs(this.position.z) < 7
    }

    static updateVisibility() {
        let directionVisible = undefined
        ;{
            const x = (sceneManager.camera.rotation.y % (Math.PI * 2)) - Math.PI
            const y = ((Slenderman.mesh.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI
            const angle = Math.atan2(Math.sin(y-x),Math.cos(y-x))
            directionVisible = Math.abs(angle) > Math.PI / 2
        }

        let inSameRoom = this.inSameRoomAsPlayer

        let wallBetween = undefined
        ;{
            const x = sceneManager.camera.position.x
            const y = sceneManager.camera.position.z
            const angle = this.calcAngleToPlayer() + Math.PI
            const dx = Math.cos(angle)
            const dy = Math.sin(angle)

            // magic line intersection formulas between player and walls
            const tx1 = (7 - x) / dx
            const ty1 = (7 - y) / dy
            const tx2 = (-7 - x) / dx
            const ty2 = (-7 - y) / dy
        
            // choose correct result
            const tx = dx > 0 ? tx1 : tx2
            const ty = dy > 0 ? ty1 : ty2
            
            // calculate intersections
            const ix = Math.abs(x + dx * ty) / 7
            const iy = Math.abs(y + dy * tx) / 7

            // check if intersections lie in doorframe (with some error)
            if (ix > 1) {
                wallBetween = iy > 0.19
            } else {
                wallBetween = ix > 0.19
            }
        }

        this.visible = directionVisible && (inSameRoom || !wallBetween)
    }

    static get roomX() {
        return Math.floor((this.position.x + 7) / 14)
    }

    static get roomZ() {
        return Math.floor((this.position.z + 7) / 14)
    }

    static calcAngleToPlayer() {
        const dx = sceneManager.camera.position.x - this.mesh.position.x
        const dz = sceneManager.camera.position.z - this.mesh.position.z
        return Math.atan2(dz, dx)
    }

    static calcAngleToGoal() {
        const dx = this.goalX - this.mesh.position.x
        const dz = this.goalZ - this.mesh.position.z
        return Math.atan2(dz, dx)
    }

    static calcDistanceToPlayer() {
        const dx = sceneManager.camera.position.x - this.mesh.position.x
        const dz = sceneManager.camera.position.z - this.mesh.position.z
        return Math.sqrt(dx * dx + dz * dz)
    }

    static calcDistanceToGoal() {
        const dx = this.goalX - this.mesh.position.x
        const dz = this.goalZ - this.mesh.position.z
        return Math.sqrt(dx * dx + dz * dz)
    }

    static async spawn() {
        if (this.hasInitted) {
            this.mesh.visible = true
            return
        }

        this.mesh = await this.makeObject()

        animationManager.startAnimation(new CustomAnimation({
            duration: Infinity,
            updateFunc: () => {
                const dx = sceneManager.camera.position.x - this.mesh.position.x
                const dz = sceneManager.camera.position.z - this.mesh.position.z
                const angle = Math.atan2(dx, dz)
                this.mesh.rotation.y = angle
            }
        }))

        this.hasInitted = true

        this.position.x = 100
        this.position.z = 100
    }

    static hide() {
        if (this.hasInitted && this.mesh.visible) {
            this.mesh.visible = false
        }
    }

    static get position() {
        if (this.mesh) {
            return this.mesh.position
        }
    }

    static get rotation() {
        if (this.mesh) {
            return this.mesh.rotation
        }
    }

    static get hasGoal() {
        return this.goalX != null && this.goalZ != null
    }

    static generateNewGoal() {
        if (this.roomX == this.roomZ && this.roomX == 0) {
            this.goalX = sceneManager.camera.position.x
            this.goalZ = sceneManager.camera.position.z
            this.currMinDistance = this.minPlayerDistance
            return
        } else {
            this.currMinDistance = this.minGoalDistance
        }

        const sign = x => x > 0 ? 8 : -8

        let doorXOffset = 0
        let doorZOffset = 0

        if (Math.abs(this.roomX) == Math.abs(this.roomZ)) {
            // TODO: make random door choice
            if ((this.roomX + this.roomZ) % 2 == 0) {
                doorZOffset = sign(-this.roomZ)
            } else {
                doorXOffset = sign(-this.roomX)
            }
        } else if (this.roomX == 0 && this.roomZ != 0) {
            doorZOffset = sign(-this.roomZ)
        } else if (this.roomZ == 0 && this.roomX != 0) {
            doorXOffset = sign(-this.roomX)
        } else if (Math.abs(this.roomX) < Math.abs(this.roomZ)) {
            doorXOffset = sign(-this.roomX)
        } else if (Math.abs(this.roomZ) < Math.abs(this.roomX)) {
            doorZOffset = sign(-this.roomZ)
        }

        this.goalX = this.roomX * 14 + doorXOffset
        this.goalZ = this.roomZ * 14 + doorZOffset
    }

    static teleport(force) {
        if (!force && this.timeSinceLastTeleport < this.teleportMinInterval) {
            return
        }

        if (!force && this.inSameRoomAsPlayer) {
            return
        }

        // choose a random corner room and teleport to it
        const toRoom = (x, z) => {
            this.position.x = x * 14 * (1 + Math.random())
            this.position.z = z * 14 * (1 + Math.random())
            this.lastTeleportTime = Date.now()
        }

        const n = Math.floor(Math.random() * 4)
        if (n == 0) {
            toRoom(1, 1)
        } else if (n == 1) {
            toRoom(-1, 1)
        } else if (n == 2) {
            toRoom(1, -1)
        } else if (n == 3) {
            toRoom(-1, -1)
        }
    }

    static move() {
        this.updateVisibility()
        if (this.visible) {
            this.frozenUpdateCount++

            if (this.frozenUpdateCount > 60 && Math.random() < 0.008) {
                this.teleport()
                this.frozenUpdateCount = 0
            } else {
                return
            }
        } else {
            this.frozenUpdateCount = 0
        }

        if (this.calcDistanceToPlayer() > 30) {
            this.teleport()
        }

        this.generateNewGoal()

        const moveAngle = this.calcAngleToGoal()
        const goalDistance = this.calcDistanceToGoal()

        const prevX = this.position.x
        const prevZ = this.position.z
        if (goalDistance > this.currMinDistance) {
            this.position.x += Math.cos(moveAngle) * this.moveSpeed
            this.position.z += Math.sin(moveAngle) * this.moveSpeed
        }

        this.updateVisibility()
        if (this.visible) {
            this.position.x = prevX
            this.position.z = prevZ
            this.updateVisibility()
            this.teleport()
        }

        if (this.calcDistanceToPlayer() < this.minPlayerDistance && !HorrorManager.paused) {
            HorrorManager.lose()
        }
    }

}

window.Slenderman = Slenderman

// -------- js/horror/horrormenu.js --------

class HorrorMenu {

    static container = document.getElementById("horror-menu-container")
    static highscoresContainer = document.getElementById("highscores-container")
    static scoreOutput = document.getElementById("score-output")
    static highscoreNameInput = document.getElementById("highscore-name-input")

    static getSections() {
        return this.container.querySelectorAll("section[data-name]")
    }
    
    static hideAllSections() {
        for (let section of this.getSections()) {
            section.style.display = "none"
        }
    }

    static getSection(name) {
        return Array.from(this.container.querySelectorAll("section[data-name]")).find(p => p.dataset.name == name)
    }

    static async getHighscores() {
        const response = await fetch("../../terminal/api/get_highscores.php?game=lol")
        const scores = await response.json()

        scores.sort((a, b) => a.score - b.score)
        let place = 0
        let currScore = Infinity
        for (let score of scores) {
            if (score.score != currScore) {
                place++
            }

            score.place = place

            currScore = score.score
        }

        return scores
    }

    static updateScoreOutput(score) {
        this.scoreOutput.textContent = score
    }

    static async updateHighscores() {
        this.highscoresContainer.innerHTML = "Loading..."
        const highscores = await this.getHighscores()
        this.highscoresContainer.innerHTML = ""

        for (let highscore of highscores) {
            const element = document.createElement("div")
            const place = document.createElement("div")
            const name = document.createElement("div")
            const score = document.createElement("div")
            const time = document.createElement("div")

            place.dataset.name = "place"
            name.dataset.name = "name"
            score.dataset.name = "score"
            time.dataset.name = "time"

            place.textContent = highscore.place
            name.textContent = highscore.name
            score.textContent = highscore.score
            time.textContent = highscore.time

            element.appendChild(place)
            element.appendChild(name)
            element.appendChild(score)
            element.appendChild(time)

            this.highscoresContainer.appendChild(element)
        }
    }

    static getHighscoreName() {
        return Comments.replaceWithAlphabet(this.highscoreNameInput.value).slice(0, 32)
    }

    static sendingButtonBusy = false
    static async sendHighscore() {
        if (this.sendingButtonBusy) {
            return
        }

        this.sendingButtonBusy = true

        const name = this.getHighscoreName()
        if (name.length == 0) {
            return
        }

        const params = {
            game: "lol", name,
            score: HorrorManager.score,
        }

        let url = "../../terminal/api/upload_highscore.php?"
        for (let [paramName, paramValue] of Object.entries(params)) {
            url += `${paramName}=${encodeURIComponent(paramValue)}&`
        }

        await fetch(url)
        await new Promise(resolve => setTimeout(resolve, 500))
        this.sendingButtonBusy = false

        this.open("highscores")
    }

    static open(sectionName="start") {
        Menu.close()
        BookViewer.close()

        this.hideAllSections()
        this.getSection(sectionName).style.display = "block"
        this.container.style.display = "flex"

        if (sectionName == "highscores") {
            this.updateHighscores()
        }

        sceneManager.blockInputs = true
    }

    static close() {
        this.container.style.display = "none"
        sceneManager.blockInputs = false
    }

    static init() {
        this.highscoreNameInput.oninput = () => {
            this.highscoreNameInput.value = this.getHighscoreName()
        }
    }

}

window.HorrorMenu = HorrorMenu

// -------- js/objects/room.js --------

const normalBookColor = 0xeeeeee

class Room {

    constructor(pathBuilder, relativePos) {
        this.pathBuilder = pathBuilder
        this.relativePos = relativePos
        this.roomId = null
        this.doorCovers = [null, null, null, null]
        this.doorCoverLines = [null, null, null, null]
        this.booksMeshes = [null, null, null, null, null, null, null, null]

        this.floorPlane = null
        this.floorContext = null

        this.dummyColor = new THREE.Color()
        this.dummyObject = new THREE.Matrix4()
        this.prevColoredInstanceId = null
        this.prevColoredShelfId = null
    }

    openDoor(direction) {
        if (this.doorCovers[direction]) {
            this.doorCovers[direction].visible = false
            this.doorCoverLines[direction].visible = true
        }
    }

    closeDoor(direction) {
        if (this.doorCovers[direction]) {
            this.doorCovers[direction].visible = true
            this.doorCoverLines[direction].visible = false
        }
    }

    update(sceneManager) {
        const cameraPathBuilder = sceneManager.pathBuilder.copy()
        for (let moveId of this.pathBuilder.naivePath) {
            cameraPathBuilder.addStop(moveId)
        }

        this.roomId = cameraPathBuilder.roomId
        for (let direction = 0; direction < 4; direction++) {
            const pathBuilder = cameraPathBuilder.copy()
            pathBuilder.addStop(direction)
            const thatRoomId = pathBuilder.roomId
            if (BookGenerator.roomExists(thatRoomId, sceneManager.currFloorId)) {
                this.openDoor(direction)
            } else {
                this.closeDoor(direction)
            }
        }

        for (let i = 0; i < this.booksMeshes.length; i++) {
            if (!this.booksMeshes[i]) {
                continue
            }
            
            const maxInstanceId = BookGenerator.getMaxInstanceIdOnShelf(this.roomId, sceneManager.currFloorId, BigInt(i))
            this.booksMeshes[i].count = parseInt(maxInstanceId)
            this.booksMeshes[i].frustumCulled = false
        }

        if (!this.floorContext) {
            return
        }

        let liesOnSearch = false
        let isSearchEnd = false
        let searchDirection = null
        if (sceneManager.searchInfo && sceneManager.searchInfo.floorId == sceneManager.currFloorId) {
            liesOnSearch = true
            for (let i = 0; i < cameraPathBuilder.path.length; i++) {
                if (cameraPathBuilder.path[i] != sceneManager.searchInfo.path[i]) {
                    liesOnSearch = false
                }
            }
            
            if (liesOnSearch) {
                if (cameraPathBuilder.path.length == sceneManager.searchInfo.path.length) {
                    isSearchEnd = true
                } else if (cameraPathBuilder.path.length > sceneManager.searchInfo.path.length) {
                    liesOnSearch = false
                } else { // cameraPathBuilder.path.length < sceneManager.searchInfo.path.length
                    searchDirection = sceneManager.searchInfo.naivePath[cameraPathBuilder.path.length]
                }
            }
        }

        const canvas = this.floorContext.canvas
        this.floorContext.fillStyle = "white"
        this.floorContext.fillRect(0, 0, canvas.width, canvas.height)

        this.floorContext.save()
        this.floorContext.translate(canvas.width / 2, canvas.height / 2)
        this.floorContext.rotate(Math.PI / 4)

        if (this.prevColoredInstanceId !== null) {
            const shelf = this.booksMeshes[this.prevColoredShelfId]
            if (shelf) {
                this.dummyColor.setHex(normalBookColor)
                shelf.setColorAt(this.prevColoredInstanceId, this.dummyColor)
                this.prevColoredInstanceId = null
                this.prevColoredShelfId = null
                shelf.instanceColor.needsUpdate = true
            }
        }

        if (liesOnSearch) {
            this.floorContext.strokeStyle = "black"
            this.floorContext.fillStyle = "black"
            this.floorContext.lineWidth = 3

            const s = canvas.width
            if (!isSearchEnd) {
                this.floorContext.rotate(-Math.PI / 4)
                this.floorContext.rotate([
                    Math.PI / 2 * 2,
                    Math.PI / 2 * 1,
                    Math.PI / 2 * 3,
                    Math.PI / 2 * 0,
                ][searchDirection])

                this.floorContext.beginPath()
                this.floorContext.moveTo(-s * 0.03, -s * 0.15)
                this.floorContext.lineTo(s * 0.03, -s * 0.15)
                this.floorContext.lineTo(s * 0.03, s * 0.01)
                this.floorContext.lineTo(s * 0.1, s * 0.01)
                this.floorContext.lineTo(0, s * 0.15)
                this.floorContext.lineTo(-s * 0.1, s * 0.01)
                this.floorContext.lineTo(-s * 0.03, s * 0.01)
                this.floorContext.closePath()
                this.floorContext.stroke()

                const text = `${sceneManager.searchInfo.path.length - cameraPathBuilder.path.length}`
                this.floorContext.fillText(text, 0, -s * 0.2, canvas.width * 0.8)
            } else {
                this.floorContext.beginPath()
                this.floorContext.arc(0, 0, s * 0.1, 0, 2 * Math.PI)
                this.floorContext.stroke()

                if (this.booksMeshes) {
                    const shelf = this.booksMeshes[sceneManager.searchInfo.shelfId]
                    if (shelf) {
                        const instanceId = sceneManager.searchInfo.rowId * 26n + sceneManager.searchInfo.columnId
                        this.dummyColor.setHex(0x000000)
                        shelf.setColorAt(parseInt(instanceId), this.dummyColor)
                        shelf.instanceColor.needsUpdate = true
    
                        this.prevColoredInstanceId = parseInt(instanceId)
                        this.prevColoredShelfId = parseInt(sceneManager.searchInfo.shelfId)
                    }
                }
            }
        }

        /*
        this.floorContext.fillStyle = "#c0c0c0"
        this.floorContext.lineWidth = 0.1
        const stringId = RoomIndicator.shortenId(this.roomId.toString())
        const text = `${stringId}`
        this.floorContext.fillText(text, 0, 0, canvas.width * 0.8)
        */

        this.floorContext.restore()

        this.floorPlane.material.map.needsUpdate = true
    }

}

class WorldBuilder {

    static buildLine(scene, points) {
        const material = new THREE.LineBasicMaterial({color: 0x000000})
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        return line
    }

    static buildWallSurface(scene, cornerLowerLeft, cornerUpperRight, {
        padding = 0, color = 0xfcfcfc
    }={}) {
        const geometry = new THREE.PlaneGeometry(
            Math.max(
                Math.abs(cornerLowerLeft.x - cornerUpperRight.x),
                Math.abs(cornerLowerLeft.z - cornerUpperRight.z),
            ) - padding,
            Math.abs(cornerLowerLeft.y - cornerUpperRight.y) - padding,
        )
        const material = new THREE.MeshBasicMaterial({color, side: THREE.DoubleSide})
        const plane = new THREE.Mesh(geometry, material)
        plane.position.set(
            (cornerUpperRight.x + cornerLowerLeft.x) / 2,
            (cornerUpperRight.y + cornerLowerLeft.y) / 2,
            (cornerUpperRight.z + cornerLowerLeft.z) / 2,
        )
        plane.rotateY(Math.atan2(
            cornerUpperRight.z - cornerLowerLeft.z,
            cornerUpperRight.x - cornerLowerLeft.x,
        ))
        scene.add(plane)
        return plane
    }

    static buildBox(scene, pos, size, {
        color = 0xccccff
    }={}) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z) 
        const material = new THREE.MeshBasicMaterial({color}) 
        const cube = new THREE.Mesh(geometry, material) 
        cube.position.set(pos.x, pos.y, pos.z)
        scene.add(cube)
        return cube
    }

    static buildBookWall(sceneManager, cornerLowerLeft, cornerUpperRight, {
        buildBooks = false, isMiddle = false, wallIndex = undefined
    }={}) {
        const cornerLowerRight = new THREE.Vector3(cornerUpperRight.x,
            cornerLowerLeft.y, cornerUpperRight.z)
    
        const delta1 = new THREE.Vector3().subVectors(cornerUpperRight, cornerLowerRight)
        const delta2 = new THREE.Vector3().subVectors(cornerLowerLeft, cornerLowerRight)
        const normalVector = new THREE.Vector3().crossVectors(delta1, delta2).normalize()
        const wallVector = new THREE.Vector3().copy(delta2).normalize()

        function posOnPlane(x, y, z=0) {
            // x, y € [0, 1]
            const v = new THREE.Vector3()
            v.lerpVectors(cornerLowerLeft, cornerLowerRight, x)
            v.y = cornerLowerLeft.y + (cornerUpperRight.y - cornerLowerLeft.y) * y
            v.addScaledVector(normalVector, -z)
            return v
        }
    
        const doorCoverLine = this.buildLine(sceneManager.scene, [
            posOnPlane(0.43, 0.0,  0.1),
            posOnPlane(0.43, 0.65, 0.1),
            posOnPlane(0.57, 0.65, 0.1),
            posOnPlane(0.57, 0.0,  0.1),
        ])
    
        this.buildWallSurface(sceneManager.scene, posOnPlane(0, 0), posOnPlane(0.43, 1))
        this.buildWallSurface(sceneManager.scene, posOnPlane(1, 0), posOnPlane(0.57, 1))
        this.buildWallSurface(sceneManager.scene, posOnPlane(0, 0.65), posOnPlane(1, 1))

        const bookDimensions = new THREE.Vector3().copy(normalVector)
            .multiplyScalar(0.25).addScaledVector(wallVector, 0.1)
        bookDimensions.y = 0.3

        let booksMeshes = []

        if (buildBooks) {
            const offsets = [0.1, 0.6]
            for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
                const offset = offsets[offsetIndex]
                const numRows = 8
                const numColumns = 26
                const numBooks = numRows * numColumns

                const bookGeometry = new THREE.BoxGeometry(bookDimensions.x, bookDimensions.y, bookDimensions.z)
                const bookMaterial = new THREE.MeshBasicMaterial()
                const booksMesh = new THREE.InstancedMesh(bookGeometry, bookMaterial, numBooks)
                booksMeshes.push(booksMesh)

                sceneManager.scene.add(booksMesh)

                const dummy = new THREE.Object3D()
                const dummyColor = new THREE.Color()

                const posFromId = (id, zOffset=0) => {
                    const row = Math.floor(id / numColumns)
                    const column = id % numColumns
                    return posOnPlane(
                        offset + column / 26 * 0.3,
                        row / 8 * 0.7 + 0.135,
                        0.3 + zOffset
                    )
                }

                for (let i = 0; i < numBooks; i++) {
                    dummy.position.copy(posFromId(i))
                    dummy.updateMatrix()
                    booksMesh.setMatrixAt(i, dummy.matrix)

                    dummyColor.setHex(normalBookColor)
                    booksMesh.setColorAt(i, dummyColor)
                }

                booksMesh.instanceMatrix.needsUpdate = true
                booksMesh.instanceColor.needsUpdate = true

                if (isMiddle) {
                    sceneManager.objectsOfInterest.add(booksMesh)

                    booksMesh.action = (_, intersect) => {
                        if (BookViewer.isOpen || BookViewer.isAnimating) {
                            return
                        }

                        const rowId = Math.floor(intersect.instanceId / numColumns)
                        const columnId = intersect.instanceId % numColumns
                        const shelfId = wallIndex * offsets.length + offsetIndex

                        const bookId = BookGenerator.bookIdFromLocation(
                            sceneManager.roomId,
                            BigInt(shelfId),
                            BigInt(rowId),
                            BigInt(columnId)
                        )
                        
                        if (HorrorManager.active && bookId == 0x287ab641f1fbbcn) {
                            HorrorManager.win()
                            return
                        }

                        dummy.position.copy(posFromId(intersect.instanceId))
                        
                        const goal = new THREE.Object3D()
                        const goalQuaternion = new THREE.Quaternion()
                        const currQuaternion = new THREE.Quaternion()
                        const originalQuaternion = new THREE.Quaternion().setFromEuler(dummy.rotation)

                        animationManager.startAnimation(new CustomAnimation({
                            duration: 500,
                            updateFunc: () => {
                                goal.position.copy(sceneManager.camera.position)
                                goal.rotation.copy(sceneManager.camera.rotation)
                                goal.translateZ(-1)

                                goalQuaternion.setFromEuler(goal.rotation)
                                currQuaternion.setFromEuler(dummy.rotation)
                                currQuaternion.slerp(goalQuaternion, 0.1)

                                dummy.position.lerp(goal.position, 0.1)
                                dummy.rotation.setFromQuaternion(currQuaternion)
                                dummy.updateMatrix()
                                booksMesh.setMatrixAt(intersect.instanceId, dummy.matrix)
                                booksMesh.instanceMatrix.needsUpdate = true
                            }
                        }))

                        BookViewer.openBook(bookId)
                        BookViewer.onNextClose(() => {
                            goal.position.copy(posFromId(intersect.instanceId))
                            const startPosition = new THREE.Vector3().copy(dummy.position)
                            goalQuaternion.copy(currQuaternion)

                            animationManager.startAnimation(new CustomAnimation({
                                duration: 500,
                                updateFunc: t => {
                                    currQuaternion.slerpQuaternions(goalQuaternion, originalQuaternion, t)
                                    dummy.rotation.setFromQuaternion(currQuaternion)

                                    dummy.position.lerpVectors(startPosition, goal.position, t)
                                    dummy.updateMatrix()
                                    booksMesh.setMatrixAt(intersect.instanceId, dummy.matrix)
                                    booksMesh.instanceMatrix.needsUpdate = true
                                }
                            }))
                        })
                    }
                }

            }
        }

        const doorCover = this.buildWallSurface(sceneManager.scene, posOnPlane(0.43, 0), posOnPlane(0.57, 0.65))
        doorCover.visible = false
        return {doorCover, booksMeshes, doorCoverLine}
    }

    static buildRoomFloor(scene, cornerLowerLeft, cornerUpperRight) {
        const canvas = document.createElement("canvas")
        canvas.width = 500
        canvas.height = canvas.width
        const context = canvas.getContext("2d")
        
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)

        context.font = `bold ${canvas.height * 0.05}px monospace`

        context.textBaseline = "middle"
        context.textAlign = "center"

        const geometry = new THREE.PlaneGeometry(
            Math.abs(cornerLowerLeft.x - cornerUpperRight.x),
            Math.abs(cornerLowerLeft.z - cornerUpperRight.z),
        )

        const material = new THREE.MeshLambertMaterial({map: new THREE.CanvasTexture(canvas)})
        const plane = new THREE.Mesh(geometry, material)
        plane.position.set(
            (cornerUpperRight.x + cornerLowerLeft.x) / 2,
            -0.1,
            (cornerUpperRight.z + cornerLowerLeft.z) / 2,
        )

        plane.rotateX(-Math.PI / 2)
        scene.add(plane)

        return {floorContext: context, floorPlane: plane}
    }

    static buildRoom(pathBuilder, roomX, roomY, sceneManager, {
        isMiddle = false,
        wallIndeces = [0, 1, 2, 3],
        bookWallIndeces = [0, 1, 2, 3]
    }={}) {
        const room = new Room(pathBuilder, new THREE.Vector2(roomX, roomY))

        const roomOrigin = new THREE.Vector3(roomX * 14, 0, roomY * 14)

        const makeCorners = offset => {
            return [
                new THREE.Vector3(roomOrigin.x - offset, roomOrigin.y, roomOrigin.z - offset),
                new THREE.Vector3(roomOrigin.x - offset, roomOrigin.y, roomOrigin.z + offset),
                new THREE.Vector3(roomOrigin.x + offset, roomOrigin.y, roomOrigin.z + offset),
                new THREE.Vector3(roomOrigin.x + offset, roomOrigin.y, roomOrigin.z - offset),
            ]
        }
    
        const lowerCorners = makeCorners(7)
        const lowerCornersInner = makeCorners(6.9)
    
        const upperCorners = lowerCorners.map(v => new THREE.Vector3(v.x, v.y + 5, v.z))
        const upperCornersInner = lowerCornersInner.map(v => new THREE.Vector3(v.x, v.y + 4.9, v.z))
    
        this.buildLine(sceneManager.scene, lowerCornersInner.concat(lowerCornersInner[0]))
        this.buildLine(sceneManager.scene, upperCornersInner.concat(upperCornersInner[0]))

        const roomDistOrigin = Math.abs(roomX) + Math.abs(roomY)
        const buildBooksGeneral = roomDistOrigin <= 3
    
        const moveIndeces = [1, 3, 2, 0]
        for (let i = 0; i < 4; i++) {
            const moveIndex = moveIndeces[i]
            if (!wallIndeces.includes(moveIndex)) {
                continue
            }

            const buildBooks = buildBooksGeneral && bookWallIndeces.includes(moveIndex)
            const {doorCover, booksMeshes, doorCoverLine} = this.buildBookWall(sceneManager, lowerCorners[i], upperCorners[(i + 1) % 4], {
                buildBooks, isMiddle, wallIndex: i})

            room.doorCovers[moveIndex] = doorCover
            room.doorCoverLines[moveIndex] = doorCoverLine

            if (booksMeshes.length > 0) {
                room.booksMeshes[i * 2 + 0] = booksMeshes[0]
                room.booksMeshes[i * 2 + 1] = booksMeshes[1]
            }

            this.buildLine(sceneManager.scene, [lowerCornersInner[i], upperCornersInner[i]])
        }

        if (roomDistOrigin <= 2) {
            const {floorContext, floorPlane} = this.buildRoomFloor(sceneManager.scene, lowerCorners[0], lowerCorners[2])
            room.floorContext = floorContext
            room.floorPlane = floorPlane
        }

        return room
    }

}

class LibraryFloor {

    constructor(renderDistance, sceneManager) {
        this.renderDistance = renderDistance
        this.sceneManager = sceneManager

        this.rooms = []
        this.addRooms()
    }

    addRooms() {
        {
            const pathBuilder = new PathBuilder()
            this.rooms.push(WorldBuilder.buildRoom(pathBuilder, 0, 0, this.sceneManager, {isMiddle: true}))
        }

        for (let i = 1; i <= this.renderDistance; i++) {
            for (let j = 0; j < 4; j++) {
                const move = RoomIndicator.moveFromPathId(j)
                const x = move.x * i
                const y = move.y * i

                const pathBuilder = new PathBuilder()
                for (let k = 0; k < i; k++) {
                    pathBuilder.addStop(j)
                }

                this.rooms.push(WorldBuilder.buildRoom(pathBuilder, x, y, this.sceneManager, {
                    wallIndeces: i > 1 ? [j] : [0, 1, 2, 3]
                }))
            }

            if (i == this.renderDistance) {
                continue
            }

            for (let movePair of [
                [0, 1], [1, 0],
                [0, 2], [2, 0],
                [2, 3], [3, 2],
                [1, 3], [3, 1]
            ]) {
                for (let p = 0; p < 2; p++) {
                    const move1 = RoomIndicator.moveFromPathId(movePair[0])
                    const move2 = RoomIndicator.moveFromPathId(movePair[1])

                    let l = i
                    if (p == 1) {
                        l += 1
                    }

                    const x = move1.x * l + move2.x * i
                    const y = move1.y * l + move2.y * i
    
                    const pathBuilder = new PathBuilder()
                    for (let k = 0; k < i; k++) {
                        pathBuilder.addStop(movePair[0])
                        pathBuilder.addStop(movePair[1])
                        if (p == 1) {
                            pathBuilder.addStop(movePair[0])
                        }
                    }
    
                    this.rooms.push(WorldBuilder.buildRoom(pathBuilder, x, y, this.sceneManager, {
                        wallIndeces: p == 0 ? [movePair[0], 3 - movePair[1]] : [3 - movePair[0], movePair[1]]
                    }))
                }
            }
        }
    
        const outerDistance = this.renderDistance * 14 + 7.1
        const outerCorners = [
            new THREE.Vector3(outerDistance, 0, outerDistance),
            new THREE.Vector3(-outerDistance, 5, outerDistance),
            new THREE.Vector3(-outerDistance, 0, -outerDistance),
            new THREE.Vector3(outerDistance, 5, -outerDistance),
        ]
    
        // draw four sorrounding black walls to block views
        for (let i = 0; i < 4; i++) {
            WorldBuilder.buildWallSurface(this.sceneManager.scene, outerCorners[i], outerCorners[(i + 1) % 4], {color: 0x000000})
        }
    
        console.log("constructed", this.rooms.length, "rooms")
    }

    updateRooms() {
        for (let room of this.rooms) {
            room.update(this.sceneManager)
        }
    }

}

// -------- js/managers/animationmanager.js --------

class Easing {

    static easeInOut(t) {
        if ((t /= 1 / 2) < 1) return 1 / 2 * t * t
        return -1 / 2 * ((--t) * (t - 2) - 1)
    }

    static linear(t) {
        return t
    }

}

class CustomAnimation {

    constructor({
        duration = 1000,
        initFunc = undefined,
        updateFunc = undefined,
        easing = Easing.linear,
        endFunc = undefined,
        repeats = 0,
        repeating = false,
        backwards = false,
        alternateDirection = false,
        id = undefined
    }={}) {
        this.id = id
        this.duration = duration
        this.initFunc = initFunc
        this.updateFunc = updateFunc
        this.endFunc = endFunc
        this.easing = easing
        this.alternateDirection = alternateDirection
        this.backwards = backwards

        if (repeating) repeats = Infinity
        this.repeats = repeats

        this.startTime = null
        this.finished = false
        this.repeatsLeft = repeats
        this.goingBackwards = backwards
        this.calledInit = false
    }

    init() {
        this.startTime = Date.now()
        this.finished = false

        if (this.initFunc && !this.calledInit) {
            this.initFunc()
            this.calledInit = true
        }
    }

    end() {
        if (this.repeatsLeft > 0) {
            this.init()
            this.repeatsLeft--
            
            if (this.alternateDirection) {
                this.goingBackwards = !this.goingBackwards
            }

            return
        }

        this.finished = true
        this.startTime = null
        if (this.endFunc) {
            this.endFunc()
        }
    }

    update() {
        if (this.startTime === null || this.finished) {
            return
        }

        let t = (Date.now() - this.startTime) / this.duration
        if (this.goingBackwards) {
            t = (1 - t)
        }

        if (t > 1 || t < 0) {
            this.updateFunc(t > 1 ? 1 : 0)
            this.end()
        } else if (this.updateFunc) {
            t = this.easing ? this.easing(t) : t
            this.updateFunc(t)
        }
    }

}

class AnimationManager {

    constructor() {
        this.animations = []
    }

    get activeIds() {
        return this.animations.filter(a => !a.finished && a.id !== undefined).map(a => a.id)
    }

    removeFinishedAnimations() {
        this.animations = this.animations.filter(a => !a.finished)
    }

    update() {
        for (const animation of this.animations) {
            animation.update()
        }
        this.removeFinishedAnimations()
    }

    startAnimation(animation) {
        // if animation is already running, cancel
        if (animation.id && this.activeIds.includes(animation.id)) {
            return
        }

        this.animations.push(animation)
        window.a = this
        animation.init()
    }

}

const animationManager = new AnimationManager()

// -------- js/managers/dommanager.js --------

import { VRButton } from 'three/addons/webxr/VRButton.js'

class DomManager {

    _isTouchDeviceF() {
        return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0))
    }

    constructor() {
        this.toggleDragModeButton = document.getElementById("toggle-drag-mode-button")

        this.isTouchDevice = this._isTouchDeviceF()
    }

    init() {
        if (this.isTouchDevice) {
            this.toggleDragModeButton.style.display = "block"
            setTimeout(() => this.toggleDragModeButton.click(), 0)
        }

        this.crosshair = new Crosshair()
    }

    initVR(sceneManager) {
        document.body.appendChild(VRButton.createButton(sceneManager.renderer))
    }

    addToBody(element) {
        document.body.appendChild(element)
    }

    update(sceneManager) {
        if (this.isTouchDevice) {
            if (sceneManager.orientationControls.enabled) {
                this.toggleDragModeButton.style.display = "block"
            } else {
                this.toggleDragModeButton.style.display = "none"
            }
        }

        this.crosshair.update()
    }
    
}

// -------- js/managers/scenemanager.js --------

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

class SceneManager {

    constructor(domManager) {
        this.domManager = domManager
        this.objectsOfInterest = new Set()
        this.previousCameraPosition = new THREE.Vector3(0, 2.5, 0)

        this.pathBuilder = new PathBuilder()
        this.currFloorId = 646n
        this.currFloor = null

        this.searchInfo = null

        this.blockInputs = true
    }

    get roomId() {
        return this.pathBuilder.roomId
    }

    async changeFloor(newFloorId, {animationDuration=2000}={}) {
        return new Promise(resolve => {
            if (newFloorId == this.currFloorId) {
                return resolve()
            }
    
            const differenceSign = parseInt(this.currFloorId - newFloorId) * -1
            this.blockInputs = true
            const startFloorId = parseInt(this.currFloorId)
    
            const originalY = this.camera.position.y
            animationManager.startAnimation(new CustomAnimation({
                duration: animationDuration,
                easing: Easing.easeInOut,
                endFunc: () => {
                    this.camera.position.y = originalY
                    this.blockInputs = false
                    
                    this.currFloorId = newFloorId
                    this.pathBuilder = new PathBuilder()
                    this.currFloor.updateRooms()
                    RoomIndicator.update(this)

                    updateFloorChoice()

                    resolve()
                },
                updateFunc: (t) => {
                    let y = (originalY + t * 5 * differenceSign) % 5
                    console.log()
                    this.currFloorId = BigInt(Math.floor(startFloorId + differenceSign * t))
                    while (y < 0) y += 5
                    this.camera.position.y = y
                    RoomIndicator.update(this)
                }
            }))
        })
    }

    teleportToSearchEnd() {
        if (this.searchInfo == null) {
            return
        }

        this.pathBuilder = new PathBuilder(
            this.searchInfo.naivePath.slice(),
            this.searchInfo.path.slice(),
            this.searchInfo.roomId
        )

        this.currFloorId = this.searchInfo.floorId
        
        this.currFloor.updateRooms()
        RoomIndicator.update(this)
    }

    teleportToMiddle() {
        this.pathBuilder = new PathBuilder()
        
        this.currFloor.updateRooms()
        RoomIndicator.update(this)
        this.camera.position.x = 0
        this.camera.position.z = 0
    }

    startSearch(searchInfo) {
        this.searchInfo = searchInfo
        this.currFloor.updateRooms()
    }

    stopSearch() {
        this.searchInfo = null
        this.currFloor.updateRooms()
    }

    initVR() {
        renderer.xr.enabled = true
    }

    makeRenderer() {
        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        return renderer
    }

    makeScene() {
        const scene = new THREE.Scene()
        scene.background = new THREE.Color().setRGB(1.0, 1.0, 1.0)
        scene.fog = new THREE.Fog(scene.background, 1, 500)
        return scene
    }

    makeCamera() {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000)
        camera.position.set(0, new URLSearchParams(window.location.search).has("elevated") ? 12.8 : 1.8, 0)
        camera.roomPosition = new THREE.Vector2(0, 0)
        return camera
    }

    makeGltfLoader() {
        const gltfLoader = new GLTFLoader()
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
        gltfLoader.setDRACOLoader(dracoLoader)
        return gltfLoader
    }
    
    addAmbientLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 3.3) // soft white light
        this.scene.add(ambientLight)
    }

    addLights() {
        this.addAmbientLight()
    }

    initControllers() {
        this.keyboardMouseControls = new FirstPersonControls(this.camera, this.renderer.domElement)
        this.orientationControls = new DeviceOrientationControls(this.camera, this.renderer.domElement)
        this.touchDragControls = new TouchDragControls(this.camera, this.renderer.domElement, this.domManager.toggleDragModeButton)
    }

    initRaycasting() {
        this.raycaster = new THREE.Raycaster()
        this.zeroVector = new THREE.Vector2()
    }

    makeOutlinePass() {
        const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera)
        outlinePass.visibleEdgeColor.set(new THREE.Color(0xccccff))
        outlinePass.edgeStrength = 10.0
        outlinePass.edgeThickness = 4.0
        outlinePass.edgeGlow = 1.0
        return outlinePass
    }

    makeRenderPass() {
        return new RenderPass(this.scene, this.camera)
    }

    makeComposer() {
        const composer = new EffectComposer(this.renderer)
        composer.addPass(this.renderPass)
        composer.addPass(this.outlinePass)
        return composer
    }

    init() {
        this.renderer = this.makeRenderer()
        this.scene = this.makeScene()
        this.camera = this.makeCamera()
        this.gltfLoader = this.makeGltfLoader()

        this.renderPass = this.makeRenderPass()
        this.outlinePass = this.makeOutlinePass()
        this.composer = this.makeComposer()

        this.addLights()
        this.initControllers()
        this.initRaycasting()

        this.currFloor = new LibraryFloor(6, this)
        this.currFloor.updateRooms()
    }
    
    get canvas() {
        if (this.renderer) {
            return this.renderer.domElement
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) {
            return
        }

        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
    
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    updateRaycasting() {
        this.raycaster.setFromCamera(this.zeroVector, this.camera)
        const intersects = this.raycaster.intersectObjects(Array.from(this.objectsOfInterest), false)

        if (intersects.length > 0) {
            const intersect = intersects[0]
            const object = intersect.object
            //this.outlinePass.selectedObjects = [object]
            
            if (object.visible) {
                this.domManager.crosshair.size = 0.5
                let clicked = !!(this.keyboardMouseControls.pressedClick)
                if (clicked && "action" in object) {
                    object.action(object, intersect)
                }
            }
        } else {
            this.domManager.crosshair.size = 1
            this.outlinePass.selectedObjects = []
        }
    }

    updateControls() {
        if (this.touchDragControls.active) {
            this.touchDragControls.update()
        } else if (this.orientationControls.enabled) {
            this.orientationControls.update()

            // to make joystick still update
            this.touchDragControls.update()
        }

        this.keyboardMouseControls.update()
    }

    exitControls() {
        this.keyboardMouseControls._removePointerLock()
    }

    update() {
        this.updateRaycasting()

        this.updateControls()

        for (let [x, z] of [["x", "z"], ["z", "x"]]) {
            if (this.camera.position[x] < -6.6 && Math.abs(this.camera.position[z]) > 0.7) {
                this.camera.position[x] = -6.6
            }
            if (this.camera.position[x] > 6.6 && Math.abs(this.camera.position[z]) > 0.7) {
                this.camera.position[x] = 6.6
            }
        }

        const changeRoom = (x, y, changeId) => {
            this.pathBuilder.addStop(changeId)
            RoomIndicator.update(this)

            this.camera.position.x -= x * 14
            this.camera.position.z -= y * 14
            this.camera.roomPosition.x += x
            this.camera.roomPosition.y += y

            if (HorrorManager.active) {
                Slenderman.position.x -= x * 14
                Slenderman.position.z -= y * 14
            }

            this.currFloor.updateRooms()
        }

        const testOpenDoor = (x, y, changeId) => {
            const testBuilder = this.pathBuilder.copy()
            testBuilder.addStop(changeId)

            if (!BookGenerator.roomExists(testBuilder.roomId, this.currFloorId)) {
                if (x != 0) {
                    this.camera.position.x = 6.6 * x
                } else {
                    this.camera.position.z = 6.6 * y
                }
            }
        }

        for (let i = 0; i < 2; i++) {
            const maxDistance = i == 0 ? 7 : 6.6
            const func = i == 0 ? changeRoom : testOpenDoor
            
            if (this.camera.position.z < -maxDistance) func(0, -1, 0)
            if (this.camera.position.z > maxDistance) func(0, 1, 3)
            if (this.camera.position.x < -maxDistance) func(-1, 0, 1)
            if (this.camera.position.x > maxDistance) func(1, 0, 2)
        }

        this.previousCameraPosition.copy(this.camera.position)
    }

    render() {
        this.composer.render()
    }

    setLoop(loopingFunc) {
        this.renderer.setAnimationLoop(loopingFunc)
    }

}

// -------- js/main.js --------

async function init3d() {

    const domManager = new DomManager()
    const sceneManager = new SceneManager(domManager)

    window.domManager = domManager
    window.sceneManager = sceneManager

    domManager.init()
    sceneManager.init()

    if (new URLSearchParams(location.search).has("vr")) {
        domManager.initVR()
        sceneManager.initVR()
    }
    
    domManager.addToBody(sceneManager.canvas)
    
    function loop() {
        HorrorManager.update()
        sceneManager.update()
        domManager.update(sceneManager)
        animationManager.update()

        sceneManager.render()
    }
    
    sceneManager.setLoop(loop)
    
    window.addEventListener("resize", () => sceneManager.onWindowResize())
    RoomIndicator.update(sceneManager)
    BookViewer.init()
    Menu.init()
    initSearch()
    updateFloorChoice()
    Comments.init()
    HorrorMenu.init()

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has("b") || urlParams.has("book")) {
        const bookCode = urlParams.get("b") || urlParams.get("book")
        try {
            const {bookId, floorId} = ShareLink.decodeBook(bookCode)
            Menu.close()
            await sceneManager.changeFloor(floorId, {animationDuration: 0})
            BookViewer.openBook(bookId)
        } catch (e) {
            // remove search params

            if (urlParams.has("debug")) {
                console.error(e)
                alert(e.message)
            } else {
                window.location.href = window.location.href.split("?")[0]
            }
        }
    }

    LoadingOverlay.hide()
}

init3d()