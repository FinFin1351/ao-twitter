import React from 'react';
import { BsCamera, BsFillXCircleFill } from 'react-icons/bs';
import { Server } from '../../server/server';
import { getBannerImage, getDefaultProcess, getPortraitImage, messageToAO, timeOfNow, uuid } from '../util/util';
import './Modal.css'
import './EditProfileModal.css'
import MessageModal from './MessageModal';
import AlertModal from './AlertModal';
import Compressor from 'compressorjs';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';

interface EditProfileModalProps {
  open: boolean;
  onClose: Function;
}

interface EditProfileModalState {
  changeBanner: boolean;
  changePortrait: boolean;
  banner: string;
  avatar: string;
  nickname: string;
  bio: string;
  message: string;
  alert: string;
  openBannerList: boolean;
  openPortraitList: boolean;
}

class EditProfileModal extends React.Component<EditProfileModalProps, EditProfileModalState> {

  pickBanner = false;

  constructor(props: EditProfileModalProps) {
    super(props);

    this.state = {
      changeBanner: false,
      changePortrait: false,
      banner: '',
      avatar: '',
      nickname: '',
      bio: '',
      message: '',
      alert: '',
      openBannerList: false,
      openPortraitList: false
    };

    this.onOpenBannerList = this.onOpenBannerList.bind(this);
    this.onCloseBannerList = this.onCloseBannerList.bind(this);
    this.onOpenPortraitList = this.onOpenPortraitList.bind(this);
    this.onClosePortraitList = this.onClosePortraitList.bind(this);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeBio = this.onChangeBio.bind(this);
    this.saveProfile = this.saveProfile.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onSelectFileChange = this.onSelectFileChange.bind(this);
  }

  componentDidMount(): void {
    this.start();
  }

  start() {
    let profile = JSON.parse(localStorage.getItem('profile'));
    if (profile) {
      this.setState({
        banner: profile.banner,
        avatar: profile.avatar,
        nickname: profile.nickname,
        bio: profile.bio,
      });
    }
  }

  onOpenBannerList() {
    this.setState({ openBannerList: true });
  }

  onCloseBannerList(banner: string) {
    let b = banner ? banner : this.state.banner;
    this.setState({ openBannerList: false, banner: b });
  }

  onOpenPortraitList() {
    this.setState({ openPortraitList: true });
  }

  onClosePortraitList(portrait: string) {
    let p = portrait ? portrait : this.state.avatar;
    this.setState({ openPortraitList: false, avatar: p });
  }

  onChangeName(e: any) {
    this.setState({ nickname: e.currentTarget.value });
  }

  onChangeBio(e: any) {
    this.setState({ bio: e.currentTarget.value });
  }

  async saveProfile() {
    let profile = JSON.parse(localStorage.getItem('profile'));

    let dirty = false;
    if (this.state.banner != profile.banner) dirty = true;
    if (this.state.avatar != profile.avatar) dirty = true;
    if (this.state.nickname != profile.nickname) dirty = true;
    if (this.state.bio != profile.bio) dirty = true;

    if (!dirty) {
      this.props.onClose();
      return;
    }

    let errorMsg = '';
    if (this.state.nickname.length < 2)
      errorMsg = 'Nickname must be at least 2 characters.';
    if (this.state.nickname.length > 32)
      errorMsg = 'Nickname can be up to 32 characters.';
    if (errorMsg != '') {
      this.setState({ alert: errorMsg });
      return;
    }

    this.setState({ message: 'Saving profile...' });

    let data = {
      nickname: this.state.nickname,
      avatar: this.state.avatar,
      banner: this.state.banner,
      bio: this.state.bio,
      time: timeOfNow()
    };
    // console.log("data:", data)

    let process = await getDefaultProcess(Server.service.getActiveAddress());
    console.log("Your default process:", process)
    if (!process) {
      this.setState({ alert: 'You have not a default process, try to disconnect and reconnect to ArConnect wallet. Then you would get a process right now.' })
      return;
    }

    let response = await messageToAO(process, data, 'AOTwitter.setProfile');

    if (response) {
      localStorage.setItem('profile', JSON.stringify(data));
      this.setState({ message: '' });
      this.props.onClose();
    }
    else {
      this.setState({ message: '', alert: 'Setting the profile failed.' });
    }
  }

  onClose() {
    this.props.onClose();
  }

  selectImage(pickBanner: boolean) {
    this.pickBanner = pickBanner;

    const fileElem = document.getElementById("fileElem");
    if (fileElem) {
      fileElem.click();
    }
  }

  onSelectFileChange(e: React.FormEvent<HTMLInputElement>): void {
    this.processImage(e.currentTarget.files[0]);
  };

  processImage(file: any) {
    if (!file) return;
    // let img = URL.createObjectURL(file);
    // console.log('FILE:', img);
    // this.setState({ portrait: img });

    // Compress the file
    new Compressor(file, {
      maxWidth: 800,
      maxHeight: 800,
      convertSize: 180000,
      success: (result) => {
        // Encode the file using the FileReader API to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          // console.log('Compress CoverImage', reader.result);
          let image = reader.result.toString();
          if (this.pickBanner)
            this.setState({ banner: image });
          else
            this.setState({ avatar: image });
        };

        reader.readAsDataURL(result);
      },
    });
  }

  createAvatar() {
    let random = uuid();
    localStorage.setItem('avatar', random);
    
    let nickname = localStorage.getItem('nickname');
    const resp = createAvatar(micah, {
      seed: nickname + random
    });

    const avatar = resp.toDataUriSync();
    this.setState({ avatar });
  }

  render() {
    if (!this.props.open)
      return (<div></div>);

    // let bannerImage = getBannerImage({ banner: this.state.banner });

    return (
      <div className="modal open">
        <div className="modal-content edit-profile-modal-content">
          <button className="modal-close-button" onClick={this.onClose}>
            <BsFillXCircleFill />
          </button>

          <div className="edit-profile-modal-header">Edit Profile</div>
          <div>
            <div className="edit-profile-banner-container">
              {/* <img className="edit-profile-banner" src={bannerImage} onClick={()=>this.selectImage(true)} /> */}
              <img className="edit-profile-banner" src={this.state.banner} />
              <img className="edit-profile-portrait" src={this.state.avatar} onClick={() => this.selectImage(false)} />
              {/* <BsCamera className="edit-profile-camera" onClick={() => this.selectImage(false)} /> */}

              <button
                className="edit-profile-random-avatar"
                onClick={() => this.createAvatar()}
              >
                DiceBear Avatar
              </button>

              <input
                type="file"
                id="fileElem"
                accept="image/*"
                className="file-select"
                onChange={this.onSelectFileChange}
              />
            </div>

            <div className='edit-profile-input-container'>
              <div className='edit-profile-input-row'>
                <div className='edit-profile-label'>Name</div>
                <input
                  className="edit-profile-input"
                  placeholder="nickname"
                  value={this.state.nickname}
                  onChange={this.onChangeName}
                />
              </div>

              <div className='edit-profile-input-row'>
                <div className='edit-profile-label'>Bio</div>
                <textarea
                  className="edit-profile-textarea"
                  placeholder="Bio"
                  value={this.state.bio}
                  onChange={this.onChangeBio}
                />
              </div>

              <div>
                <button onClick={this.saveProfile}>Save</button>
              </div>
            </div>
          </div>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default EditProfileModal;